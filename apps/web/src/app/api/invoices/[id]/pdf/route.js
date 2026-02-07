import sql from "@/app/api/utils/sql.js";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const idInt = Number.parseInt(id, 10);
    if (!Number.isFinite(idInt)) {
      return new Response("Invalid invoice id", { status: 400 });
    }

    const url = new URL(request.url);
    const requestedCurrency = (
      url.searchParams.get("currency") || ""
    ).toUpperCase();
    const primaryParam = url.searchParams.get("primary");
    const lightParam = url.searchParams.get("light");
    const logoParam = url.searchParams.get("logo");

    // Fetch invoice header with joins
    const invoiceRows = await sql`
      SELECT i.*, 
             c.company_name, c.contact_name, c.email as customer_email, c.phone as customer_phone,
             c.address as customer_address, c.city as customer_city, c.state as customer_state, c.zip_code as customer_zip,
             p.project_number, p.title as project_title
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ${idInt}
      LIMIT 1
    `;

    if (!invoiceRows.length) {
      return new Response("Invoice not found", { status: 404 });
    }

    const invoice = invoiceRows[0];

    // Fetch line items
    const items = await sql`
      SELECT * FROM invoice_line_items WHERE invoice_id = ${idInt} ORDER BY line_order, id
    `;

    // Fetch payments
    const payments = await sql`
      SELECT * FROM payments WHERE invoice_id = ${idInt} ORDER BY payment_date, id
    `;

    // Company settings
    const settingsRows =
      await sql`SELECT setting_key, setting_value FROM company_settings`;
    const companySettings = {};
    settingsRows.forEach(
      (s) => (companySettings[s.setting_key] = s.setting_value),
    );

    const currency = ["IDR", "USD", "SGD"].includes(requestedCurrency)
      ? requestedCurrency
      : (companySettings.default_currency || "IDR").toUpperCase();

    const colors = {
      primary:
        validateHex(primaryParam) || companySettings.primary_color || "#0F4C81",
      lightPrimary:
        validateHex(lightParam) || companySettings.primary_light || "#E6F0FA",
    };

    const headerLogoUrl = logoParam || companySettings.logo_url || null;
    const letterheadBackgroundUrl = null;

    const safeAreas = {
      top: "30mm",
      bottom: "18mm",
      left: "20mm",
      right: "20mm",
    };

    const html = generateInvoiceHTML(
      invoice,
      items,
      payments,
      companySettings,
      currency,
      colors,
      headerLogoUrl,
      letterheadBackgroundUrl,
      safeAreas,
    );

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number}.html"`,
      },
    });
  } catch (err) {
    console.error("GET /api/invoices/[id]/pdf error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

function validateHex(val) {
  if (!val) return null;
  try {
    const decoded = decodeURIComponent(val);
    const v = decoded.trim();
    return /^#([A-Fa-f0-9]{6})$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

function normalizeMm(val, fallbackNumber) {
  const n = parseFloat(val);
  if (!isFinite(n) || n < 0) return `${fallbackNumber}mm`;
  return `${n}mm`;
}

function formatCurrency(amount, currency = "IDR") {
  const map = {
    IDR: { locale: "id-ID", currency: "IDR", minimumFractionDigits: 0 },
    USD: { locale: "en-US", currency: "USD", minimumFractionDigits: 2 },
    SGD: { locale: "en-SG", currency: "SGD", minimumFractionDigits: 2 },
  };
  const cfg = map[currency] || map.IDR;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    minimumFractionDigits: cfg.minimumFractionDigits,
  }).format(parseFloat(amount || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateInvoiceHTML(
  invoice,
  items,
  payments,
  companySettings,
  currency,
  colors,
  headerLogoUrl,
  letterheadBackgroundUrl,
  safeAreas,
) {
  const primary = colors.primary;
  const lightPrimary = colors.lightPrimary;
  // UPDATED: include email and change style handled via CSS below
  const headerAddress = [
    companySettings.address_line1 || "Jl. Gajah Mada – Tiban Baru",
    companySettings.address_line2 || "Ruko Onassis Blok A  No.  05",
    companySettings.address_line3 || "Tiban Baru – Batam",
    `${companySettings.phone || "Tlp. 0778 8011380"}`,
    companySettings.email ? `${companySettings.email}` : "",
  ]
    .filter(Boolean)
    .join("<br/>");

  const itemsHtml = (items || [])
    .map(
      (it) => `
      <tr>
        <td class="desc">${escapeHtml(it.description || "-")}</td>
        <td class="qty">${parseFloat(it.quantity || 0).toLocaleString("id-ID")}</td>
        <td class="price">${formatCurrency(it.unit_price, currency)}</td>
        <td class="total">${formatCurrency(it.line_total ?? parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0), currency)}</td>
      </tr>`,
    )
    .join("");

  const paymentsHtml = (payments || [])
    .map(
      (p) => `
      <tr>
        <td>${formatDate(p.payment_date)}</td>
        <td>${(p.payment_method || "").replace("_", " ")}</td>
        <td class="text-right">${formatCurrency(p.amount, currency)}</td>
        <td>${p.reference_number || "-"}</td>
      </tr>`,
    )
    .join("");

  const hasLetterhead = false; // force reusable header/footer

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Invoice ${invoice.invoice_number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  /* UNIFY: A4 full-bleed page with controlled safe areas like quotations */
  @page{size:A4;margin:0}
  body{font-family:'Times New Roman',serif;font-size:12px;line-height:1.45;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{height:297mm;width:210mm;position:relative;overflow:hidden;page-break-after:always}
  .page:last-child{page-break-after:auto}
  /* Safe areas: header 30mm, footer 18mm, sides 20mm */
  .page-content{position:absolute;top:30mm;bottom:18mm;left:20mm;right:20mm;overflow:hidden}

  /* Shared header block (matches quotations) */
  .company-header{display:flex;align-items:flex-start;gap:20px;padding-bottom:6px;margin-bottom:8px;page-break-inside:avoid;break-inside:avoid}
  .company-logo img{max-width:99px;max-height:88px;object-fit:contain}
  .company-info{flex:1;text-align:right}
  .company-address{font-family: Arial, Helvetica, sans-serif; font-size:9px; line-height:1.35; color:${primary}; text-align:right}
  .rule{display:flex;flex-direction:column;gap:3px;margin-bottom:12px}
  .rule .line-thick{height:5.1px;background:${primary}}
  .rule .line-thin{height:1.7px;background:${primary}}

  .title{display:flex;justify-content:space-between;align-items:center;margin:6px 0 10px;padding-bottom:6px}
  .title-left{font-size:14px;font-weight:bold;text-decoration:underline;color:${primary}}
  .title-right{font-size:12px;font-weight:bold;color:#333}

  table{width:100%;border-collapse:collapse}
  thead{display: table-header-group} /* repeat when table breaks */
  .items th,.items td{border:1.6px solid #000;padding:7px;vertical-align:top}
  .items th{background:${lightPrimary};font-weight:bold;text-align:center;font-size:11px}
  .items td.desc{width:auto}
  .items td.qty{width:80px;text-align:center}
  .items td.price,.items td.total{width:120px;text-align:right}
  .items tbody tr:last-child td{border-bottom-width:2px} /* crisp end per page */

  .summary{margin-top:12px;display:flex;justify-content:flex-end}
  .summary-table{width:360px;border-collapse:collapse}
  .summary-table td{padding:6px;border-bottom:1px solid #e5e5e5}
  .summary-table td.label{font-weight:bold}
  .text-right{text-align:right}

  .section{margin:12px 0}
  .section-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:8px}
  .payments th,.payments td{border:1.2px solid #000;padding:6px}
  .payments th{background:${lightPrimary}}

  /* Shared footer block (matches quotations) */
  .page-footer{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:flex-start;height:18mm;page-break-inside:avoid;break-inside:avoid}
  .page-footer .rule{margin:0 0 6px 0}
  .footer-bar{display:flex;align-items:center;justify-content:space-between;padding:0 20mm}
  .footer-left{font-size:10px;color:${primary};font-weight:bold; font-family:'BankGothic Md BT','BankGothic','Bank Gothic','Eurostile','Arial Black',sans-serif}
  .footer-right{font-size:10px;color:${primary}}
</style>
</head>
<body>
  <div class="page">
    <div class="page-content">
      <div class="company-header">
        ${headerLogoUrl ? `<div class=\"company-logo\"><img src=\"${headerLogoUrl}\" alt=\"Company Logo\"/></div>` : ""}
        <div class="company-info"><div class="company-address">${headerAddress}</div></div>
      </div>
      <div class="rule"><div class="line-thick"></div><div class="line-thin"></div></div>

      <div class="title">
        <div class="title-left">INVOICE</div>
        <div class="title-right">${invoice.invoice_number}</div>
      </div>

      <div class="bill-ship">
        <div>
          <div class="box-title">BILL TO</div>
          <div><strong>${escapeHtml(invoice.company_name || "-")}</strong></div>
          ${invoice.contact_name ? `<div>Attn: ${escapeHtml(invoice.contact_name)}</div>` : ""}
          ${invoice.customer_email ? `<div>${escapeHtml(invoice.customer_email)}</div>` : ""}
          ${invoice.customer_phone ? `<div>${escapeHtml(invoice.customer_phone)}</div>` : ""}
          ${invoice.customer_address ? `<div class="muted" style="margin-top:6px">${escapeHtml(invoice.customer_address)}${invoice.customer_city ? ", " + escapeHtml(invoice.customer_city) : ""}${invoice.customer_state ? ", " + escapeHtml(invoice.customer_state) : ""} ${escapeHtml(invoice.customer_zip || "")}</div>` : ""}
        </div>
        <div>
          <div class="box-title">INVOICE DETAILS</div>
          <div>Date: ${formatDate(invoice.issue_date)}</div>
          <div>Due Date: ${formatDate(invoice.due_date)}</div>
          <div>Payment Terms: ${escapeHtml(invoice.payment_terms || "-")}</div>
          ${invoice.project_number ? `<div>Project: ${escapeHtml(invoice.project_number)}${invoice.project_title ? " — " + escapeHtml(invoice.project_title) : ""}</div>` : ""}
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price (${currency})</th>
            <th>Total (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || `<tr><td colspan="4">No items</td></tr>`}
        </tbody>
      </table>

      <div class="summary">
        <table class="summary-table">
          <tr><td class="label">Subtotal</td><td class="text-right">${formatCurrency(invoice.subtotal, currency)}</td></tr>
          <tr><td class="label">Tax (${parseFloat(invoice.tax_rate || 0).toFixed(2)}%)</td><td class="text-right">${formatCurrency(invoice.tax_amount, currency)}</td></tr>
          <tr><td class="label">Total</td><td class="text-right"><strong>${formatCurrency(invoice.total_amount, currency)}</strong></td></tr>
          <tr><td class="label">Amount Paid</td><td class="text-right" style="color:green">${formatCurrency(invoice.amount_paid, currency)}</td></tr>
          <tr><td class="label">Balance Due</td><td class="text-right" style="color:${parseFloat(invoice.balance_due || 0) > 0 ? "red" : "green"}"><strong>${formatCurrency(invoice.balance_due, currency)}</strong></td></tr>
        </table>
      </div>

      ${
        payments && payments.length
          ? `
      <div class="section">
        <div class="section-title">Payment History</div>
        <table class="payments" style="width:100%;border-collapse:collapse;margin-top:6px">
          <thead><tr><th>Date</th><th>Method</th><th>Amount (${currency})</th><th>Reference</th></tr></thead>
          <tbody>${paymentsHtml}</tbody>
        </table>
      </div>`
          : ""
      }

    </div>
    <div class="page-footer">
      <div class="rule"><div class="line-thick"></div><div class="line-thin"></div></div>
      <div class="footer-bar">
        <div class="footer-left">HVAC SERVICE SPECIALIST</div>
        <div class="footer-right">Page <span class="page-number"></span></div>
      </div>
    </div>
  </div>

  <script>
    (function(){
      const pages = document.querySelectorAll('.page');
      pages.forEach((p,i)=>{const el=p.querySelector('.page-number'); if(el) el.textContent=(i+1)+' of '+pages.length});
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
