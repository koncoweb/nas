import sql from "@/app/api/utils/sql.js";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    // Ensure numeric ID to avoid mismatched type or casting issues
    const idInt = Number.parseInt(id, 10);
    if (!Number.isFinite(idInt)) {
      return new Response("Invalid quotation id", { status: 400 });
    }

    // capture currency preference from query (?currency=IDR|USD|SGD)
    const url = new URL(request.url);
    const requestedCurrency = (
      url.searchParams.get("currency") || ""
    ).toUpperCase();

    // allow runtime brand color overrides via query
    const primaryParam = url.searchParams.get("primary"); // e.g. %230F4C81
    const lightParam = url.searchParams.get("light"); // e.g. %23E6F0FA

    // allow runtime logo override via query (?logo=https%3A%2F%2F...)
    const logoParam = url.searchParams.get("logo");

    // Get quotation data directly from database instead of making HTTP call
    const quotationResults = await sql`
      SELECT 
        q.*,
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.zip_code
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ${idInt}
      LIMIT 1
    `;

    if (quotationResults.length === 0) {
      return new Response("Quotation not found", { status: 404 });
    }

    const quotation = quotationResults[0];

    // Get line items (INCLUDE scope_group)
    const lineItemResults = await sql`
      SELECT 
        qli.*,
        m.name as material_name,
        m.part_number,
        m.unit_type as material_unit_type
      FROM quotation_line_items qli
      LEFT JOIN materials m ON qli.material_id = m.id
      WHERE qli.quotation_id = ${idInt}
      ORDER BY qli.line_order, qli.id
    `;

    // Get scope of work (group titles stored as description)
    const scopeWorkResults = await sql`
      SELECT *
      FROM quotation_scope_work
      WHERE quotation_id = ${idInt}
      ORDER BY step_number, id
    `;

    // Get company settings directly from database
    const settingsResults = await sql`
      SELECT setting_key, setting_value
      FROM company_settings
    `;

    const companySettings = {};
    settingsResults.forEach((setting) => {
      companySettings[setting.setting_key] = setting.setting_value;
    });

    // Resolve currency with priority: query -> quotation.currency -> company setting -> IDR
    const allowedCurrencies = ["IDR", "USD", "SGD"];
    const currency = allowedCurrencies.includes(requestedCurrency)
      ? requestedCurrency
      : allowedCurrencies.includes((quotation.currency || "").toUpperCase())
        ? (quotation.currency || "IDR").toUpperCase()
        : (companySettings.default_currency || "IDR").toUpperCase();

    // Resolve brand colors (order: query -> company_settings -> defaults)
    const resolvedColors = {
      primary:
        validateHex(primaryParam) || companySettings.primary_color || "#0F4C81", // deep brand blue
      lightPrimary:
        validateHex(lightParam) || companySettings.primary_light || "#E6F0FA", // light brand tint
    };

    // Resolve logo for header (order: query -> company_settings -> none)
    const headerLogoUrl = logoParam || companySettings.logo_url || null;

    // Force disable full-page letterhead background (use reusable header/footer)
    const letterheadBackgroundUrl = null;

    // Safe areas are not used when letterhead is disabled but keep defaults for future use
    const safeAreas = {
      top: "30mm",
      bottom: "18mm",
      left: "20mm",
      right: "20mm",
    };

    // Combine all data
    const quotationData = {
      ...quotation,
      line_items: lineItemResults,
      scope_work: scopeWorkResults,
    };

    // Generate HTML for PDF
    const htmlContent = generateQuotationHTML(
      quotationData,
      companySettings,
      currency,
      resolvedColors,
      headerLogoUrl,
      letterheadBackgroundUrl, // stays null to ensure standard header/footer
      safeAreas,
    );

    // Return HTML with PDF-optimized styles
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="quotation-${quotation.quote_number}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
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

// ADD: plain amount formatter (no currency symbol) for table cells & totals
function formatAmount(amount, currency = "IDR", opts = {}) {
  const map = {
    IDR: { locale: "id-ID", minimumFractionDigits: 2 }, // show ,00 as in screenshot
    USD: { locale: "en-US", minimumFractionDigits: 2 },
    SGD: { locale: "en-SG", minimumFractionDigits: 2 },
  };
  const cfg = map[currency] || map.IDR;
  const minimumFractionDigits =
    typeof opts.minimumFractionDigits === "number"
      ? opts.minimumFractionDigits
      : cfg.minimumFractionDigits;
  return new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
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

function groupItemsByScope(items = []) {
  const map = new Map();
  items.forEach((it) => {
    const key = (it.scope_group || "").trim() || "General";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  });
  return Array.from(map.entries()).map(([title, rows]) => ({ title, rows }));
}

function generateQuotationHTML(
  quotation,
  companySettings,
  currency,
  colors,
  headerLogoUrl,
  letterheadBackgroundUrl,
  safeAreas,
) {
  // brand colors + header data (unchanged)
  const primary = colors?.primary || companySettings.primary_color || "#0F4C81";
  const lightPrimary =
    colors?.lightPrimary || companySettings.primary_light || "#E6F0FA";
  const showVessel = quotation.vessel_name || "-";
  const showLocation = quotation.location || "-";
  const headerAddress = [
    companySettings.address_line1 || "Jl. Gajah Mada – Tiban Baru",
    companySettings.address_line2 || "Ruko Onassis Blok A  No.  05",
    companySettings.address_line3 || "Tiban Baru – Batam",
    `${companySettings.phone || "Tlp. 0778 8011380"}`,
    companySettings.email ? `${companySettings.email}` : "",
  ]
    .filter(Boolean)
    .join("<br/>");

  const noteText = quotation.location
    ? `FOB ${quotation.location}`
    : companySettings.default_delivery_note || "";

  const grandTotal = quotation.final_price;

  // Sizing (A4)
  const PAGE_H = 297; // mm
  const PAGE_W = 210; // mm
  const headerMm =
    parseFloat((safeAreas?.top || "30mm").replace("mm", "")) || 30;
  const footerMm =
    parseFloat((safeAreas?.bottom || "18mm").replace("mm", "")) || 18;
  const leftMm =
    parseFloat((safeAreas?.left || "20mm").replace("mm", "")) || 20;
  const rightMm =
    parseFloat((safeAreas?.right || "20mm").replace("mm", "")) || 20;
  const CONTENT_H = PAGE_H - headerMm - footerMm; // mm
  const CONTENT_W = PAGE_W - leftMm - rightMm; // mm

  // Column widths (unchanged)
  const COL_W = { no: 8, qty: 10, unit: 14, price: 24, total: 28 }; // mm
  const descWidthMm = Math.max(
    40,
    CONTENT_W -
      (COL_W.no + COL_W.qty + COL_W.unit + COL_W.price + COL_W.total) -
      10,
  );

  // Grouping
  const grouped = groupItemsByScope(quotation.line_items || []);

  // ---- Pagination helpers (tighten row estimates to match tighter cell spacing) ----
  const HEIGHTS = {
    groupTitle: 10,
    tableHead: 6, // tightened to match header padding/line-height
    subtotal: 8,
    sectionGap: 4,
    noteBlock: noteText ? 12 : 0,
    exclusionsTitle: 8,
    exclusionsItem: 5,
    termsTitle: 8,
    termsLine: 6,
  };

  const CONTENT_TOP_FIXED = 40;
  const SAFETY_MM = 16;
  const MIN_BOTTOM_GAP_MM = 14;
  const SECTION_MARGIN_MM = 3.2;

  // Tighter estimator to remove extra blank space while keeping safety
  const ROW_BASE_MM = 4.2; // was 4.6
  const ROW_PER_LINE_MM = 3.8; // was 4.2
  const ROW_FUDGE_MM = 1.8; // was 2.2
  const CHAR_PER_MM = 0.5;
  const CHARS_PER_LINE = Math.max(40, Math.floor(descWidthMm * CHAR_PER_MM));
  function estimateRowHeight(item) {
    const raw = String(item.description || "-");
    const parts = raw.split(/\r?\n/).map((p) => p.trim());
    let lines = 0;
    parts.forEach((p) => {
      const len = p.length || 1;
      lines += Math.max(1, Math.ceil(len / CHARS_PER_LINE));
    });
    const subCount =
      item.material_name && item.material_name !== item.description ? 1 : 0;
    return (
      ROW_BASE_MM +
      (lines - 1) * ROW_PER_LINE_MM +
      subCount * 2.0 + // slightly tighter for sub line as well
      ROW_FUDGE_MM
    );
  }
  function calcRowsHeight(rows) {
    return (rows || []).reduce((acc, r) => acc + estimateRowHeight(r), 0);
  }
  function estimateGroupHeight(grp) {
    const rowsMm = calcRowsHeight(grp.rows || []);
    return (
      HEIGHTS.groupTitle +
      HEIGHTS.sectionGap +
      HEIGHTS.tableHead +
      rowsMm +
      HEIGHTS.subtotal +
      SECTION_MARGIN_MM
    );
  }
  function computeGroupSubtotal(rows = []) {
    return rows.reduce(
      (sum, r) =>
        sum + parseFloat(r.quantity || 0) * parseFloat(r.unit_price || 0),
      0,
    );
  }
  function splitGroupRowsStrict(grp, remainingMm) {
    const rows = [...(grp.rows || [])];
    const headerBlock =
      HEIGHTS.groupTitle + HEIGHTS.sectionGap + HEIGHTS.tableHead;
    let available = remainingMm - headerBlock - SECTION_MARGIN_MM;
    if (available <= ROW_BASE_MM) {
      return { consumedRows: [], leftoverRows: rows };
    }
    const consumedRows = [];
    let used = 0;
    for (let i = 0; i < rows.length; i++) {
      const h = estimateRowHeight(rows[i]);
      if (used + h > available) break;
      consumedRows.push(rows[i]);
      used += h;
    }
    return { consumedRows, leftoverRows: rows.slice(consumedRows.length) };
  }

  // Build pages with strict non-loss guarantee
  const scopePages = [];
  let currentPage = [];
  let usedMm = CONTENT_TOP_FIXED;

  grouped.forEach((grp) => {
    const groupSubtotal = computeGroupSubtotal(grp.rows || []);
    let groupOffset = 0; // numbering base across chunks

    const totalH = estimateGroupHeight(grp);
    if (usedMm > CONTENT_TOP_FIXED && usedMm + totalH > CONTENT_H - SAFETY_MM) {
      scopePages.push(currentPage);
      currentPage = [];
      usedMm = CONTENT_TOP_FIXED;
    }

    const remainingSpace = CONTENT_H - usedMm - SAFETY_MM;
    if (totalH <= remainingSpace) {
      currentPage.push({
        type: "group",
        title: grp.title,
        part: {
          rows: grp.rows,
          last: true,
          startIndex: 0,
          subtotal: groupSubtotal,
        },
      });
      usedMm += totalH;
      return;
    }

    let remainingRows = [...grp.rows];
    while (remainingRows.length) {
      const remainingMm = CONTENT_H - usedMm - SAFETY_MM;
      const tempGrp = { title: grp.title, rows: remainingRows };
      let { consumedRows, leftoverRows } = splitGroupRowsStrict(
        tempGrp,
        remainingMm,
      );

      // Guard: if nothing fits on this page, start a new one
      if (consumedRows.length === 0) {
        if (currentPage.length) {
          scopePages.push(currentPage);
          currentPage = [];
        }
        usedMm = CONTENT_TOP_FIXED;
        continue;
      }

      // Adjust if chunk still overflows or leaves too small gap
      const adjustUntilFits = () => {
        let isLastChunk = leftoverRows.length === 0;
        let chunkH =
          HEIGHTS.groupTitle +
          HEIGHTS.sectionGap +
          HEIGHTS.tableHead +
          calcRowsHeight(consumedRows) +
          (isLastChunk ? HEIGHTS.subtotal : 0) +
          SECTION_MARGIN_MM;
        while (
          consumedRows.length > 0 &&
          (usedMm + chunkH > CONTENT_H - SAFETY_MM ||
            CONTENT_H - SAFETY_MM - (usedMm + chunkH) < MIN_BOTTOM_GAP_MM)
        ) {
          const moved = consumedRows.pop();
          leftoverRows = [moved, ...leftoverRows];
          isLastChunk = false; // once we move, this chunk isn't last
          chunkH =
            HEIGHTS.groupTitle +
            HEIGHTS.sectionGap +
            HEIGHTS.tableHead +
            calcRowsHeight(consumedRows) +
            SECTION_MARGIN_MM;
        }
        return { chunkH, leftoverRows, isLastChunk };
      };

      const {
        chunkH,
        leftoverRows: adjustedLeftover,
        isLastChunk,
      } = adjustUntilFits();

      if (consumedRows.length === 0) {
        if (currentPage.length) {
          scopePages.push(currentPage);
          currentPage = [];
        }
        usedMm = CONTENT_TOP_FIXED;
        continue;
      }

      currentPage.push({
        type: "group",
        title: grp.title,
        part: {
          rows: consumedRows,
          last: isLastChunk,
          startIndex: groupOffset,
          subtotal: groupSubtotal,
        },
      });

      usedMm += chunkH;
      groupOffset += consumedRows.length;
      remainingRows = adjustedLeftover;

      if (remainingRows.length) {
        scopePages.push(currentPage);
        currentPage = [];
        usedMm = CONTENT_TOP_FIXED;
      }
    }

    // Non-loss assertion: ensure remaining rows are rendered
    if (groupOffset < (grp.rows || []).length) {
      const missing = (grp.rows || []).slice(groupOffset);
      scopePages.push([
        {
          type: "group",
          title: grp.title,
          part: {
            rows: missing,
            last: true,
            startIndex: groupOffset,
            subtotal: groupSubtotal,
          },
        },
      ]);
      usedMm = CONTENT_TOP_FIXED;
    }
  });

  if (currentPage.length) scopePages.push(currentPage);

  // --- EXTRA SAFEGUARD: verify no rows lost per group across all pages and fix subtotal flags ---
  try {
    const expectedMap = new Map(grouped.map((g) => [g.title, g.rows || []]));
    const collectedMap = new Map();
    scopePages.forEach((page) => {
      page.forEach((sec) => {
        if (sec.type !== "group") return;
        const arr = collectedMap.get(sec.title) || [];
        collectedMap.set(sec.title, arr.concat(sec.part.rows || []));
      });
    });

    grouped.forEach((grp) => {
      const expected = expectedMap.get(grp.title) || [];
      const collected = collectedMap.get(grp.title) || [];
      const sectionsForTitle = [];
      scopePages.forEach((page) => {
        page.forEach((sec) => {
          if (sec.type === "group" && sec.title === grp.title) {
            sectionsForTitle.push(sec);
            sec.part.last = false;
          }
        });
      });
      if (sectionsForTitle.length) {
        sectionsForTitle[sectionsForTitle.length - 1].part.last =
          collected.length >= expected.length;
      }
      if (collected.length < expected.length) {
        const missing = expected.slice(collected.length);
        const startIndex = collected.length;
        scopePages.push([
          {
            type: "group",
            title: grp.title,
            part: {
              rows: missing,
              last: true,
              startIndex,
              subtotal: computeGroupSubtotal(expected),
            },
          },
        ]);
      }
    });
  } catch (e) {
    console.warn("pagination safeguard warning", e);
  }
  // --------------------------------------------------------------------

  // Build fixed header & footer (unchanged)
  const headerFixedHtml = `
    <div class="page-header-fixed">
      <div class="hf-inner">
        ${
          headerLogoUrl
            ? `<div class="company-logo"><img src="${headerLogoUrl}" alt="Company Logo"/></div>`
            : ""
        }
        <div class="company-info">
          <div class="company-address">${headerAddress}</div>
        </div>
      </div>
      <div class="rule rule-header"><div class="line-thick"></div><div class="line-thin"></div></div>
    </div>
  `;

  function renderScopePage(sectionsHtml) {
    return `
      <div class="page">
        ${headerFixedHtml}
        <div class="page-content">
          <div class="page-header">
            <div class="page-title">Scope of Work</div>
            <div class="page-ref">Ref: ${quotation.quote_number}</div>
          </div>
          ${sectionsHtml}
        </div>
        <div class="page-footer">
          <div class="rule rule-footer"><div class="line-thick"></div><div class="line-thin"></div></div>
          <div class="footer-bar">
            <div class="footer-left">HVAC SERVICE SPECIALIST</div>
            <div class="footer-right">Page <span class="page-number"></span></div>
          </div>
        </div>
      </div>`;
  }

  function renderGroupSection(
    title,
    rows,
    showSubtotal,
    startIndex = 0,
    groupSubtotal = 0,
  ) {
    const rowsHtml = rows
      .map((item, idx) => {
        const qty = parseFloat(item.quantity || 0).toLocaleString("id-ID");
        const unit = item.unit_type || item.material_unit_type || "Unit";
        const unitPrice = formatAmount(item.unit_price, currency);
        const lineTotalRaw =
          parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
        const lineTotal = formatAmount(
          item.line_total ?? lineTotalRaw,
          currency,
        );
        return `
          <tr>
            <td class="tbl-no">${startIndex + idx + 1}</td>
            <td class="tbl-desc">
              <div>${item.description || "-"}</div>
              ${
                item.material_name && item.material_name !== item.description
                  ? `<div class="sub muted">${item.material_name}${item.part_number ? ` • PN. ${item.part_number}` : ""}</div>`
                  : ""
              }
            </td>
            <td class="tbl-qty">${qty}</td>
            <td class="tbl-unit">${unit}</td>
            <td class="tbl-price">${unitPrice}</td>
            <td class="tbl-total">${lineTotal}</td>
          </tr>`;
      })
      .join("");

    const totalsHtml = showSubtotal
      ? `<tr class="totals-row"><td colspan="5" style="text-align:right">Subtotal</td><td class="tbl-total">${formatAmount(groupSubtotal, currency)}</td></tr>`
      : "";

    const colgroup = `
      <colgroup>
        <col style="width:${COL_W.no}mm" />
        <col style="width:auto" />
        <col style="width:${COL_W.qty}mm" />
        <col style="width:${COL_W.unit}mm" />
        <col style="width:${COL_W.price}mm" />
        <col style="width:${COL_W.total}mm" />
      </colgroup>`;

    return `
      <div class="section">
        <div class="section-title" style="text-decoration:none">${title}</div>
        <table class="scope-table" style="margin-top:6px">
          ${colgroup}
          <thead>
            <tr>
              <th class="tbl-no">No</th>
              <th class="tbl-desc">Description</th>
              <th class="tbl-qty">Qty</th>
              <th class="tbl-unit">Unit</th>
              <th class="tbl-price">Price (${currency})</th>
              <th class="tbl-total">Total Price (${currency})</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${totalsHtml}
          </tbody>
        </table>
      </div>`;
  }

  const scopePagesHtml = scopePages.map((pageSections) => {
    const sectionsHtml = pageSections
      .map((sec) =>
        renderGroupSection(
          sec.title,
          sec.part.rows,
          sec.part.last,
          sec.part.startIndex || 0,
          sec.part.subtotal || 0,
        ),
      )
      .join("");
    return renderScopePage(sectionsHtml);
  });

  // Exclusions + Terms page(s): estimate and place after scope
  const defaultExclusions = [
    "Machinery equipment, lifting, rigging, and staging",
    "Acetylene, oxygen, carpentry work, and painting work",
    "Technician Accommodation & Transportation",
    "Taxes and duties (if applicable) and yard surcharges",
    "Other services and spare parts are not specified in this technical proposal",
  ];
  const exclusions =
    quotation.exclusions &&
    Array.isArray(quotation.exclusions) &&
    quotation.exclusions.length
      ? quotation.exclusions
      : defaultExclusions;

  const dp = Math.max(
    0,
    Math.min(100, parseFloat(quotation.payment_percentage || 100)),
  );
  const paymentLines =
    dp >= 100
      ? [`100% ${quotation.payment_timing || "Upon work completion"}.`]
      : [
          `${dp}% Down payment upon order confirmation.`,
          `${formatAmount(100 - dp, "USD", { minimumFractionDigits: 0 })}% Balance payment upon work completion.`,
        ];

  const grandTotalPlain = formatAmount(grandTotal, currency, {
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
  });

  // Build the Cover Letter page
  const coverPageHtml = `
  <div class="page">
    ${headerFixedHtml}
    <div class="page-content">
      <div class="reference-section">
        <div>
          <div class="ref-title">QUOTATION</div>
          <div class="ref-details">
            <div><strong>Ref</strong> : ${quotation.quote_number}</div>
            <div><strong>Date</strong> : ${formatDate(quotation.created_at)}</div>
            <div><strong>Vessel</strong> : ${showVessel}</div>
            <div><strong style="text-decoration:underline; color:${primary}">Location :</strong> ${showLocation}</div>
            <div><strong>Revision</strong> : ${quotation.revision_number || 0}</div>
          </div>
        </div>
        <div>
          <div class="customer-title">CUSTOMER:</div>
          <div class="customer-details">
            <div class="customer-name">${quotation.company_name || "-"}</div>
            ${quotation.contact_name ? `<div>Attn: ${quotation.contact_name}</div>` : ""}
          </div>
        </div>
      </div>

      ${quotation.title ? `<div class="section"><div class="section-title">SERVICE TITLE</div><div><strong>${quotation.title}</strong></div></div>` : ""}

      <div class="introduction">
        <div class="greeting">${quotation.contact_name ? `Dear ${quotation.contact_name.split(" ")[0]},` : "Dear Sir/Madam,"}</div>
        <div class="intro-text">
          ${quotation.description ? `<p style="white-space:pre-wrap">${quotation.description}</p>` : ""}
        </div>
        <div class="closing">
          <p>We sincerely hope you will consider our submission favourably and we look forward to further our service to your esteemed company.</p>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div class="rule rule-footer"><div class="line-thick"></div><div class="line-thin"></div></div>
      <div class="footer-bar">
        <div class="footer-left">HVAC SERVICE SPECIALIST</div>
        <div class="footer-right">Page <span class="page-number"></span></div>
      </div>
    </div>
  </div>`;

  // Exclusions & Terms might need 1+ pages; render as one consolidated page for now with auto flow
  const extrasPageHtml = `
  <div class="page">
    ${headerFixedHtml}
    <div class="page-content">
      <div class="page-header">
        <div class="page-title">Quotation Details</div>
        <div class="page-ref">Ref: ${quotation.quote_number}</div>
      </div>

      ${noteText ? `<div class="section"><em>Note : ${noteText}</em></div>` : ""}

      <div class="section">
        <div class="section-title">EXCLUSIONS:</div>
        <ul class="list">${exclusions.map((e, i) => `<li>${i + 1}. ${e}</li>`).join("")}</ul>
      </div>

      <div class="section">
        <div class="section-title">Terms and Conditions</div>
        <div class="list">
          <div><strong>1.0 PRICE (${currency})</strong></div>
          <div style="margin:6px 0 12px 12px">Grand Total: <strong>${grandTotalPlain}</strong></div>
          ${quotation.time_estimation_work ? `<div><strong>2.0 TIME ESTIMATION</strong></div><div style="margin:6px 0 12px 12px">${quotation.time_estimation_work}</div>` : ""}
          <div><strong>3.0 PAYMENT TERMS</strong></div>
          <div style="margin:6px 0 12px 12px">${paymentLines.map((l) => `<div>${l}</div>`).join("")}</div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div class="rule rule-footer"><div class="line-thick"></div><div class="line-thin"></div></div>
      <div class="footer-bar">
        <div class="footer-left">HVAC SERVICE SPECIALIST</div>
        <div class="footer-right">Page <span class="page-number"></span></div>
      </div>
    </div>
  </div>`;

  // Compose all pages: cover + scope (auto-split) + extras
  const allPagesHtml = [coverPageHtml, ...scopePagesHtml, extrasPageHtml].join(
    "",
  );

  // Return full HTML with updated CSS for proper printing and repeating headers
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotation ${quotation.quote_number} - ${companySettings.company_name || "PT. NATA AIR SAGARA"}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    /* Use full-bleed page and control header/footer precisely */
    @page{size:A4;margin:0}
    body{font-family: 'Times New Roman', serif;font-size:12px;line-height:1.45;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{height:${PAGE_H}mm;width:${PAGE_W}mm;position:relative;page-break-after:always;overflow:hidden}
    .page:last-child{page-break-after:auto}
    .page-content{position:absolute;top:${headerMm}mm;bottom:${footerMm}mm;left:${leftMm}mm;right:${rightMm}mm;overflow:hidden}

    /* Fixed header per page to ensure letterhead appears on every page */
    .page-header-fixed{position:absolute;top:0;left:0;right:0;height:${headerMm}mm;display:flex;flex-direction:column;justify-content:flex-end}
    .page-header-fixed .hf-inner{display:flex;align-items:flex-start;gap:20px;padding:10mm ${leftMm}mm 4mm ${leftMm}mm}
    .company-logo img{max-width:99px;max-height:88px;object-fit:contain}
    .company-info{flex:1;text-align:right;padding-right:${rightMm}mm}
    .company-address{font-family: Arial, Helvetica, sans-serif; font-size:9px; line-height:1.35; color:${primary}; text-align:right}
    .rule{display:flex;flex-direction:column;gap:3px;margin:0 ${leftMm}mm 6px ${leftMm}mm}
    .rule .line-thick{height:5.1px;background:${primary}}
    .rule .line-thin{height:1.7px;background:${primary}}

    /* Content page header */
    .page-header{display:flex;justify-content:space-between;align-items:center;margin:6px 0 10px;padding-bottom:6px;page-break-inside:avoid;break-inside:avoid}
    .page-title{font-size:14px;font-weight:bold;text-decoration:underline;color:${primary}}

    /* Reference/cover sections */
    .reference-section{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:14px 0}
    .ref-title,.customer-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:8px}
    .ref-details div,.customer-details div{margin-bottom:6px}
    .customer-name{font-weight:bold;font-size:13px}
    .introduction{margin:14px 0;text-align:justify}
    .greeting{margin-bottom:10px;font-weight:bold}
    .intro-text p{margin-bottom:10px}

    /* Tables */
    table{width:100%;border-collapse:collapse;table-layout:auto}
    thead{display: table-header-group} /* repeat header when table breaks */
    tfoot{display: table-row-group}
    tr{page-break-inside:avoid;break-inside:avoid}
    /* Tighter cells to remove yellow-highlighted empty space */
    .scope-table th,.scope-table td{border:1.6px solid #000;padding:2px 2px;vertical-align:middle; line-height:1.15}
    .scope-table th{background:${lightPrimary};font-weight:bold;text-align:center;font-size:11px; vertical-align:middle}

    /* Numeric columns centered horizontally and vertically; prevent wrap */
    .tbl-no{ text-align:center; white-space:nowrap; vertical-align:middle }
    .tbl-qty{ text-align:center; white-space:nowrap; vertical-align:middle }
    .tbl-unit{ text-align:center; white-space:nowrap; vertical-align:middle }
    .tbl-price,.tbl-total{ text-align:center; white-space:nowrap; vertical-align:middle }

    /* Description: top aligned, even tighter to remove blank area */
    .tbl-desc{ width:auto; word-break:break-word; white-space:pre-wrap; line-height:1.15; padding-top:1px; padding-bottom:1px; vertical-align:top }
    .tbl-desc > div{ margin:0 }

    .sub.muted{color:#555;font-size:11px;margin-top:1px;line-height:1.1}
    .totals-row td{font-weight:bold}

    .section{margin:${SECTION_MARGIN_MM}mm 0;page-break-inside:avoid;break-inside:avoid}
    .section-title{font-size:13px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:8px}
    .list{margin-left:18px}
    .list li{margin-bottom:6px}

    .page-footer{position:absolute;left:0;right:0;bottom:0;height:${footerMm}mm;display:flex;flex-direction:column;justify-content:flex-start}
    .page-footer .rule{margin:0 ${leftMm}mm 6px ${leftMm}mm}
    .footer-bar{display:flex;align-items:center;justify-content:space-between;padding:0 ${leftMm}mm}
    .footer-left{font-size:10px;color:${primary};font-weight:bold; font-family:'BankGothic Md BT','BankGothic','Bank Gothic','Eurostile','Arial Black',sans-serif}
    .footer-right{font-size:10px;color:${primary}}

  </style>
</head>
<body>
  ${allPagesHtml}
  <script>
    (function(){
      const pages = document.querySelectorAll('.page');
      pages.forEach((p, i) => {
        const el = p.querySelector('.page-number');
        if (el) el.textContent = (i+1) + ' of ' + pages.length;
      });
    })();
  </script>
</body>
</html>`;
}
