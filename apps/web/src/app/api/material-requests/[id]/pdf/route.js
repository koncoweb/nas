import sql from "@/app/api/utils/sql.js";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const idInt = Number.parseInt(id, 10);
    if (!Number.isFinite(idInt)) {
      return new Response("Invalid material request id", { status: 400 });
    }

    const url = new URL(request.url);
    const requestedCurrency = (
      url.searchParams.get("currency") || ""
    ).toUpperCase();
    const primaryParam = url.searchParams.get("primary");
    const lightParam = url.searchParams.get("light");
    const logoParam = url.searchParams.get("logo");

    // Fetch material request with joins
    const requestRows = await sql`
      SELECT mr.*, 
             p.project_number, p.title as project_title,
             c.company_name, c.contact_name, c.email as customer_email, c.phone as customer_phone,
             c.address as customer_address, c.city as customer_city, c.state as customer_state, c.zip_code as customer_zip,
             u.name as requested_by_name
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE mr.id = ${idInt}
      LIMIT 1
    `;

    if (!requestRows.length) {
      return new Response("Material request not found", { status: 404 });
    }

    const requestData = requestRows[0];

    // Fetch items
    const items = await sql`
      SELECT mri.*, m.name as material_name, m.part_number, m.unit_type as material_unit_type
      FROM material_request_items mri
      LEFT JOIN materials m ON mri.material_id = m.id
      WHERE mri.material_request_id = ${idInt}
      ORDER BY mri.item_order, mri.id
    `;

    // Fetch approvals
    const approvals = await sql`
      SELECT aw.*, u.name as approver_name
      FROM approval_workflows aw
      LEFT JOIN auth_users u ON aw.approver_id = u.id
      WHERE aw.material_request_id = ${idInt}
      ORDER BY aw.step_order
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

    const html = generateMaterialRequestHTML(
      requestData,
      items,
      approvals,
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
        "Content-Disposition": `inline; filename="material-request-${requestData.id}.html"`,
      },
    });
  } catch (err) {
    console.error("GET /api/material-requests/[id]/pdf error", err);
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

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function generateMaterialRequestHTML(
  req,
  items,
  approvals,
  companySettings,
  currency,
  colors,
  headerLogoUrl,
  letterheadBackgroundUrl,
  safeAreas,
) {
  const primary = colors.primary;
  const lightPrimary = colors.lightPrimary;
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
      (it, idx) => `
      <tr>
        <td class="no">${idx + 1}</td>
        <td class="desc">
          <div>${escapeHtml(it.description || "-")}</div>
          ${it.material_name ? `<div class="sub muted">${escapeHtml(it.material_name)}${it.part_number ? ` • PN. ${escapeHtml(it.part_number)}` : ""}</div>` : ""}
        </td>
        <td class="qty">${parseFloat(it.quantity || 0).toLocaleString("id-ID")}</td>
        <td class="unit">${escapeHtml(it.unit_type || it.material_unit_type || "Unit")}</td>
        <td class="price">${formatCurrency(it.estimated_unit_cost, currency)}</td>
        <td class="total">${formatCurrency(parseFloat(it.estimated_unit_cost || 0) * parseFloat(it.quantity || 0), currency)}</td>
      </tr>
    `,
    )
    .join("");

  const approvalsHtml = (approvals || [])
    .map(
      (a) => `
      <tr>
        <td style="text-transform:capitalize">${escapeHtml(a.approver_role)}</td>
        <td>${escapeHtml(a.approver_name || "-")}</td>
        <td style="text-transform:capitalize">${escapeHtml(a.status)}</td>
        <td>${a.approved_at ? formatDate(a.approved_at) : "-"}</td>
        <td>${escapeHtml(a.comments || "-")}</td>
      </tr>
    `,
    )
    .join("");

  const total = (items || []).reduce(
    (s, it) =>
      s +
      parseFloat(it.quantity || 0) * parseFloat(it.estimated_unit_cost || 0),
    0,
  );

  const hasLetterhead = false; // force reusable header/footer

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Material Request ${req.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  /* UNIFY: match quotations A4 safe area layout */
  @page{size:A4;margin:0}
  body{font-family:'Times New Roman',serif;font-size:12px;line-height:1.45;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{height:297mm;width:210mm;position:relative;overflow:hidden;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .page-content{position:absolute;top:30mm;bottom:18mm;left:20mm;right:20mm;overflow:hidden}

  .company-header{display:flex;align-items:flex-start;gap:20px;padding-bottom:6px;margin-bottom:8px;page-break-inside:avoid;break-inside:avoid}
  /* INCREASE LOGO SIZE BY ~10% */
  .company-logo img{max-width:99px;max-height:88px;object-fit:contain}
  .company-info{flex:1;text-align:right}
  .company-address{font-family: Arial, Helvetica, sans-serif; font-size:9px; line-height:1.35; color:${primary}; text-align:right}
  .rule{display:flex;flex-direction:column;gap:3px;margin-bottom:12px}
  .rule .line-thick{height:5.1px;background:${primary}}
  .rule .line-thin{height:1.7px;background:${primary}}

  .title{display:flex;justify-content:space-between;align-items:center;margin:6px 0 10px;padding-bottom:6px}
  .title-left{font-size:14px;font-weight:bold;text-decoration:underline;color:${primary}}
  .title-right{font-size:12px;font-weight:bold;color:${primary}}

  table{width:100%;border-collapse:collapse}
  thead{display: table-header-group} /* repeat when table breaks */
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:12px 0}
  .box-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:6px}
  .muted{color:#555}

  .items th,.items td{border:1.6px solid #000;padding:7px;vertical-align:top}
  .items th{background:${lightPrimary};font-weight:bold;text-align:center;font-size:11px}
  .items td.no{width:40px;text-align:center}
  .items td.qty{width:80px;text-align:center}
  .items td.unit{width:80px;text-align:center}
  .items td.price,.items td.total{width:120px;text-align:right}
  .items td.desc{width:auto}
  .items tbody tr:last-child td{border-bottom-width:2px}

  .section{margin:12px 0}
  .section-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:8px}
  .approval th,.approval td{border:1.2px solid #000;padding:6px}
  .approval th{background:${lightPrimary}}

  .summary{margin-top:12px;display:flex;justify-content:flex-end}
  .summary-table{width:360px;border-collapse:collapse}
  .summary-table td{padding:6px;border-bottom:1px solid #e5e5e5}
  .summary-table td.label{font-weight:bold}

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
        <div class="title-left">MATERIAL REQUEST</div>
        <div class="title-right">#${req.id}</div>
      </div>

      <div class="grid-2">
        <div>
          <div class="box-title">PROJECT</div>
          <div><strong>${escapeHtml(req.project_number || "-")}</strong> — ${escapeHtml(req.project_title || "")}</div>
          <div>Status: ${escapeHtml(req.status || "draft")}</div>
          <div>Requested By: ${escapeHtml(req.requested_by_name || "-")}</div>
          <div>Request Date: ${formatDate(req.request_date)}</div>
          ${req.needed_date ? `<div>Needed By: ${formatDate(req.needed_date)}</div>` : ""}
          <div>Urgency: ${escapeHtml(req.urgency || "medium")}</div>
        </div>
        <div>
          <div class="box-title">CUSTOMER</div>
          <div><strong>${escapeHtml(req.company_name || "-")}</strong></div>
          ${req.customer_email ? `<div>${escapeHtml(req.customer_email)}</div>` : ""}
          ${req.customer_phone ? `<div>${escapeHtml(req.customer_phone)}</div>` : ""}
          ${req.customer_address ? `<div class="muted" style="margin-top:6px">${escapeHtml(req.customer_address)}${req.customer_city ? ", " + escapeHtml(req.customer_city) : ""}${req.customer_state ? ", " + escapeHtml(req.customer_state) : ""} ${escapeHtml(req.customer_zip || "")}</div>` : ""}
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>No</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Est. Unit Cost (${currency})</th>
            <th>Est. Total (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || `<tr><td colspan="6">No items</td></tr>`}
        </tbody>
      </table>

      <div class="summary">
        <table class="summary-table">
          <tr><td class="label">Estimated Total</td><td style="text-align:right"><strong>${formatCurrency(total, currency)}</strong></td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Approval Workflow</div>
        <table class="approval" style="width:100%;border-collapse:collapse;margin-top:6px">
          <thead><tr><th>Role</th><th>Approver</th><th>Status</th><th>Date</th><th>Comments</th></tr></thead>
          <tbody>${approvalsHtml || '<tr><td colspan="5">No approvals</td></tr>'}</tbody>
        </table>
      </div>

      ${req.description ? `<div class="section"><div class="section-title">Notes</div><div class="muted">${escapeHtml(req.description)}</div></div>` : ""}

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
