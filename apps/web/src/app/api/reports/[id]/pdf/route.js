import sql from "@/app/api/utils/sql.js";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const idInt = Number.parseInt(id, 10);
    if (!Number.isFinite(idInt)) {
      return new Response("Invalid report id", { status: 400 });
    }

    const url = new URL(request.url);
    const requestedCurrency = (
      url.searchParams.get("currency") || ""
    ).toUpperCase();
    const primaryParam = url.searchParams.get("primary");
    const lightParam = url.searchParams.get("light");
    const logoParam = url.searchParams.get("logo");

    // Fetch report with joins (add quotation for numbering)
    const reportRows = await sql`
      SELECT r.*, 
             p.project_number, p.title as project_title,
             q.quote_number,
             c.company_name, c.contact_name, c.email as customer_email, c.phone as customer_phone,
             c.address as customer_address, c.city as customer_city, c.state as customer_state, c.zip_code as customer_zip
      FROM project_reports r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN quotations q ON p.quotation_id = q.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE r.id = ${idInt}
      LIMIT 1
    `;

    if (!reportRows.length) {
      return new Response("Report not found", { status: 404 });
    }

    const report = reportRows[0];

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

    const safeAreas = {
      top: "30mm",
      bottom: "18mm",
      left: "20mm",
      right: "20mm",
    };

    const html = generateReportHTML(
      report,
      companySettings,
      currency,
      colors,
      headerLogoUrl,
      null,
      safeAreas,
    );

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="report-${report.id}.html"`,
      },
    });
  } catch (err) {
    console.error("GET /api/reports/[id]/pdf error", err);
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

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// NEW: compute document number (WDR/DO + YYYYMM + quotation ref)
function computeDocNo(report) {
  const isDO = (report.report_type || "work_done") === "delivery_order";
  if (report.delivery_number) return report.delivery_number;
  const prefix = isDO ? "DO" : "WDR";
  const dateStr = isDO ? report.delivered_date : report.completion_date;
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const ym = `${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, "0")}`;
  const ref = (report.quote_number || report.project_number || "").toString();
  const normalized = ref
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${ym}-${normalized}`;
}

function generateReportHTML(
  report,
  companySettings,
  _currency,
  colors,
  headerLogoUrl,
  _letterheadBackgroundUrl,
  _safeAreas,
) {
  const primary = colors.primary;
  const headerAddress = [
    companySettings.address_line1 || "Jl. Gajah Mada – Tiban Baru",
    companySettings.address_line2 || "Ruko Onassis Blok A  No.  05",
    companySettings.address_line3 || "Tiban Baru – Batam",
    `${companySettings.phone || "Tlp. 0778 8011380"}`,
    companySettings.email ? `${companySettings.email}` : "",
  ]
    .filter(Boolean)
    .join("<br/>");

  const section = (title, content) =>
    content
      ? `<div class="section"><div class="section-title">${title}</div><div class="section-body">${wrapPara(
          content,
        )}</div></div>`
      : "";

  const customerBlock = `
    <div><strong>${escapeHtml(report.company_name || "-")}</strong></div>
    ${report.customer_email ? `<div>${escapeHtml(report.customer_email)}</div>` : ""}
    ${report.customer_phone ? `<div>${escapeHtml(report.customer_phone)}</div>` : ""}
    ${report.customer_address ? `<div class="muted" style="margin-top:6px">${escapeHtml(report.customer_address)}${report.customer_city ? ", " + escapeHtml(report.customer_city) : ""}${report.customer_state ? ", " + escapeHtml(report.customer_state) : ""} ${escapeHtml(report.customer_zip || "")}</div>` : ""}
  `;

  const isDO = (report.report_type || "work_done") === "delivery_order";
  const docNo = computeDocNo(report);

  const titleLeft = isDO ? "DELIVERY ORDER" : "WORK DONE REPORT";

  const leftBox = isDO
    ? `
      <div class="box-title">DELIVERY</div>
      <div>Delivery No: <strong>${escapeHtml(docNo)}</strong></div>
      <div>Delivered Date: ${formatDate(report.delivered_date)}</div>
      <div>Project No: ${escapeHtml(report.project_number || "-")}</div>
    `
    : `
      <div class="box-title">PROJECT</div>
      <div><strong>${escapeHtml(report.project_title || "-")}</strong></div>
      <div>Project No: ${escapeHtml(report.project_number || "-")}</div>
      <div>Report No: <strong>${escapeHtml(docNo)}</strong></div>
      <div>Completion Date: ${formatDate(report.completion_date)}</div>
    `;

  const body = isDO
    ? `
      ${section("Delivery Items", report.delivery_items)}
      ${section("Notes", report.delivery_notes)}
    `
    : `
      ${section("Work Summary", report.work_summary)}
      ${section("Materials Used", report.materials_used)}
      ${section("Recommendations", report.recommendations)}
      ${section("Issues Encountered", report.issues_encountered)}
      ${section("Customer Feedback", report.customer_feedback)}
    `;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${titleLeft} ${escapeHtml(report.project_number || "")}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:0}
  body{font-family:'Times New Roman',serif;font-size:12px;line-height:1.45;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{height:297mm;width:210mm;position:relative;overflow:hidden;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .page-content{position:absolute;top:30mm;bottom:18mm;left:20mm;right:20mm;overflow:hidden}

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

  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:12px 0}
  .box-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:6px}
  .muted{color:#555}

  .section{margin:12px 0}
  .section-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:8px}
  .section-body p{margin-bottom:8px}

  .signature-block{display:grid;grid-template-columns:1fr auto;gap:40px;margin-top:24px}
  .customer-signature{max-width:120px;max-height:90px;object-fit:contain;border:1px solid #e5e5e5;padding:4px}

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
        <div class="title-left">${titleLeft}</div>
        <div class="title-right">${escapeHtml(docNo)}</div>
      </div>

      <div class="grid-2">
        <div>
          ${leftBox}
        </div>
        <div>
          <div class="box-title">CUSTOMER</div>
          ${customerBlock}
        </div>
      </div>

      <div id="flow-sections">
        ${body}

        <div class="signature-block">
          <div>
            <div>Prepared by,</div>
            <div><strong>${escapeHtml(companySettings.director_name || "Cucup Supriatna")}</strong></div>
            <div>${escapeHtml(companySettings.director_title || "Commercial Manager")}</div>
          </div>
          <div>
            ${report.customer_signature_url ? `<img src=\"${report.customer_signature_url}\" alt=\"Customer Signature\" class=\"customer-signature\"/>` : ""}
            ${report.customer_signed_date ? `<div class=\"muted\" style=\"margin-top:6px\">Signed: ${formatDate(report.customer_signed_date)}</div>` : ""}
          </div>
        </div>
      </div>

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
      function makePage(){
        const page = document.createElement('div');
        page.className = 'page';

        const content = document.createElement('div');
        content.className = 'page-content';

        const header = document.querySelector('.company-header').cloneNode(true);
        const rule = document.querySelector('.rule').cloneNode(true);
        const title = document.querySelector('.title').cloneNode(true);
        const grid = document.querySelector('.grid-2').cloneNode(true);
        const flow = document.createElement('div');
        flow.id = 'flow-sections';

        content.appendChild(header);
        content.appendChild(rule);
        content.appendChild(title);
        content.appendChild(grid);
        content.appendChild(flow);

        const footer = document.querySelector('.page-footer').cloneNode(true);

        page.appendChild(content);
        page.appendChild(footer);
        document.body.appendChild(page);
        return page;
      }

      // Paginate sections (move .section and signature-block nodes)
      const firstPage = document.querySelector('.page');
      const container = firstPage.querySelector('#flow-sections');
      const nodes = Array.from(container.children);

      let currentPage = firstPage;
      let currentContainer = container;

      // Start fresh container for content on first page
      container.innerHTML = '';

      nodes.forEach((node) => {
        currentContainer.appendChild(node);
        const contentEl = currentPage.querySelector('.page-content');
        if (contentEl.scrollHeight > contentEl.clientHeight) {
          // overflow: move node to next page
          currentContainer.removeChild(node);
          const newPage = makePage();
          currentPage = newPage;
          currentContainer = newPage.querySelector('#flow-sections');
          currentContainer.appendChild(node);
        }
      });

      // Update page numbers
      const pages = document.querySelectorAll('.page');
      pages.forEach((p,i)=>{const el=p.querySelector('.page-number'); if(el) el.textContent=(i+1)+' of '+pages.length});
    })();
  </script>
</body>
</html>`;
}

function wrapPara(text) {
  const safe = escapeHtml(text || "");
  return safe
    .split(/\n+/)
    .map((p) => `<p>${p}</p>`)
    .join("");
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
