"use client";

import { useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function QuotationPreview({
  formData,
  scopeGroups = [],
  customers,
  calculations,
}) {
  // Fetch company settings to match PDF branding
  const { data, isLoading, error } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/company");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/settings/company, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const companySettings = data?.settings || {};

  // Build a preview "quotation" object from the in-progress form
  const previewQuotation = useMemo(() => {
    const customer = (customers || []).find(
      (c) => String(c.id) === String(formData?.customer_id),
    );

    // Flatten groups into line items with scope_group for grouping in preview
    const normalizedItems = [];
    (scopeGroups || []).forEach((g) => {
      const title = (g.title || "").trim();
      (g.items || []).forEach((it, idx) => {
        const qty = Number(it.quantity || 0);
        const price = Number(it.unit_price || 0);
        normalizedItems.push({
          id: `${title}-${idx}`,
          description: it.description || "",
          quantity: qty,
          unit_type: it.unit_type || "Unit",
          unit_price: price,
          line_total: qty * price,
          scope_group: title || null,
        });
      });
    });

    // Build scope_work groups just for display if needed
    const normalizedScope = (scopeGroups || [])
      .map((g, i) => ({ id: i + 1, description: g.title || "" }))
      .filter((g) => g.description);

    return {
      id: "preview",
      quote_number: formData?.quote_number || "Draft",
      created_at: formData?.issue_date || new Date().toISOString(),
      revision_number: formData?.revision_number || 0,
      title: formData?.title || "(Service Title)",
      description: formData?.description || "",
      vessel_name: formData?.vessel_name || "",
      location: formData?.location || "",

      // Customer snapshot
      company_name: customer?.company_name || "(Select customer)",
      contact_name: customer?.contact_name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",

      // Currency & totals
      currency: (formData?.currency || "IDR").toUpperCase(),
      final_price: Number(calculations?.total || 0),
      total_cost: Number(calculations?.total || 0),

      // Collections
      line_items: normalizedItems,
      scope_work: normalizedScope,

      // Terms
      payment_percentage: formData?.payment_percentage || 100,
      payment_timing: formData?.payment_timing || "Upon work completion",
      time_estimation_work: formData?.time_estimation_work || "",
      validity_days: formData?.validity_days || 7,
      other_terms: formData?.other_terms || "",
    };
  }, [customers, formData, scopeGroups, calculations]);

  // Currency-aware formatter consistent with the form selection
  const currency = (formData?.currency || "IDR").toUpperCase();
  const formatAmount = (amount) => {
    const n = Number(amount || 0);
    if (currency === "USD") {
      return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (currency === "SGD") {
      return n.toLocaleString("en-SG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return n.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const headerAddress = useMemo(() => {
    return [
      companySettings.address_line1 || "Jl. Gajah Mada – Tiban Baru",
      companySettings.address_line2 || "Ruko Onassis Blok A  No.  05",
      companySettings.address_line3 || "Tiban Baru – Batam",
      companySettings.phone || "Tlp. 0778 8011380",
      companySettings.email ? `${companySettings.email}` : "",
    ]
      .filter(Boolean)
      .join("<br/>");
  }, [companySettings]);

  const previewHtml = useMemo(() => {
    const primary = companySettings.primary_color || "#0F4C81";
    const lightPrimary = companySettings.primary_light || "#E6F0FA";

    // group items by scope
    const groups = new Map();
    (previewQuotation.line_items || []).forEach((it) => {
      const key = (it.scope_group || "").trim() || "General";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    });

    const groupsHtml = Array.from(groups.entries())
      .map(([title, rows]) => {
        const bodyRows = rows
          .map((item, idx) => {
            const qty = parseFloat(item.quantity || 0).toLocaleString("id-ID");
            const unit = item.unit_type || "Unit";
            const unitPrice = formatAmount(item.unit_price);
            const total = formatAmount(
              (item.line_total != null
                ? item.line_total
                : parseFloat(item.quantity || 0) *
                  parseFloat(item.unit_price || 0)) || 0,
            );
            return `
              <tr>
                <td class="tbl-no">${idx + 1}</td>
                <td class="tbl-desc"><div>${item.description || "-"}</div></td>
                <td class="tbl-qty">${qty}</td>
                <td class="tbl-unit">${unit}</td>
                <td class="tbl-price">${unitPrice}</td>
                <td class="tbl-total">${total}</td>
              </tr>`;
          })
          .join("");

        let subtotal = 0;
        rows.forEach((r) => {
          subtotal +=
            parseFloat(r.quantity || 0) * parseFloat(r.unit_price || 0);
        });

        const colgroup = `
          <colgroup>
            <col style="width:8mm" />
            <col style="width:auto" />
            <col style="width:10mm" />
            <col style="width:14mm" />
            <col style="width:24mm" />
            <col style="width:28mm" />
          </colgroup>`;

        return `
          <div class="section">
            <div class="section-title" style="text-decoration:none">${title}</div>
            <table class="scope-table" style="margin-top:1px">
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
                ${bodyRows}
                <tr class="totals-row"><td colspan="5" style="text-align:right">Subtotal</td><td class="tbl-total">${formatAmount(subtotal)}</td></tr>
              </tbody>
            </table>
          </div>`;
      })
      .join("");

    const headerLogoUrl = companySettings.logo_url || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Quotation Preview</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:0}
  /* compact base */
  body{font-family:'Times New Roman', serif;font-size:11px;line-height:1.25;color:#000;background:#fff}
  .page{height:297mm;width:210mm;position:relative;overflow:hidden}
  .page-content{position:absolute;top:16mm;bottom:12mm;left:10mm;right:10mm;overflow:auto}
  .company-header{display:flex;align-items:flex-start;gap:8px;padding-bottom:2px;margin-bottom:2px}
  .company-logo img{max-width:84px;max-height:76px;object-fit:contain}
  .company-info{flex:1;text-align:right}
  .company-address{font-family: Arial, Helvetica, sans-serif; font-size:8.5px; line-height:1.2; color:${primary}; text-align:right}
  .rule{display:flex;flex-direction:column;gap:1px;margin-bottom:4px}
  .rule .line-thick{height:4px;background:${primary}}
  .rule .line-thin{height:1px;background:${primary}}
  .page-header{display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px;padding-bottom:2px}
  .page-title{font-size:12px;font-weight:bold;text-decoration:underline;color:${primary}}
  .page-ref{font-size:10px;font-weight:bold;color:${primary}}
  table{width:100%;border-collapse:collapse}
  thead{display: table-header-group}
  .scope-table th,.scope-table td{border:1px solid #000;padding:1px 2px;vertical-align:middle; line-height:1.2}
  .scope-table th{background:${lightPrimary};font-weight:bold;text-align:center;font-size:11px}
  .tbl-no{width:40px;text-align:center; white-space:nowrap; vertical-align:middle}
  .tbl-qty{width:70px;text-align:center; white-space:nowrap; vertical-align:middle}
  .tbl-unit{width:70px;text-align:center; white-space:nowrap; vertical-align:middle}
  .tbl-price,.tbl-total{width:120px;text-align:center; white-space:nowrap; vertical-align:middle}
  .tbl-desc{width:auto; word-break:break-word; white-space:pre-wrap; line-height:1.15; padding-top:1px; padding-bottom:1px; vertical-align:top}
  .totals-row td{font-weight:bold}
  .section{margin:6px 0}
  .section-title{font-size:11px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:4px}
  .page-footer{position:absolute;left:0;right:0;bottom:0;height:10mm;display:flex;flex-direction:column;justify-content:flex-start}
  .page-footer .rule{margin:0 0 2px 0}
  .footer-bar{display:flex;align-items:center;justify-content:space-between;padding:0 10mm}
  .footer-left{font-size:9.5px;color:${primary};font-weight:bold; font-family:'BankGothic Md BT','BankGothic','Bank Gothic','Eurostile','Arial Black',sans-serif}
  .footer-right{font-size:9.5px;color:${primary}}
</style>
</head>
<body>
  <div class="page">
    <div class="page-content">
      <div class="company-header">
        ${
          headerLogoUrl
            ? `<div class="company-logo"><img src="${headerLogoUrl}" alt="Company Logo"/></div>`
            : ""
        }
        <div class="company-info">
          <div class="company-address">${headerAddress}</div>
        </div>
      </div>
      <div class="rule"><div class="line-thick"></div><div class="line-thin"></div></div>
      <div class="page-header">
        <div class="page-title">Scope of Work</div>
        <div class="page-ref">Ref: ${previewQuotation.quote_number}</div>
      </div>
      ${groupsHtml}
    </div>
    <div class="page-footer">
      <div class="rule"><div class="line-thick"></div><div class="line-thin"></div></div>
      <div class="footer-bar">
        <div class="footer-left">HVAC SERVICE SPECIALIST</div>
        <div class="footer-right">Page 1 of 1</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }, [companySettings, headerAddress, previewQuotation, currency]);

  // Toolbar actions
  const iframeRef = useRef(null);
  const handlePrint = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) win.print();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleExportHtml = useCallback(() => {
    try {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.open();
      w.document.write(previewHtml);
      w.document.close();
    } catch (e) {
      console.error(e);
    }
  }, [previewHtml]);

  const sanitize = (s) =>
    (s || "")
      .toString()
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, "-");
  const suggestedName = `quotation-${sanitize(previewQuotation.quote_number || "draft")}.pdf`;

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integrations/pdf-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: previewHtml, filename: suggestedName }),
      });
      if (!res.ok) {
        throw new Error(
          `When POST /api/integrations/pdf-generation, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const blob = await res.blob();
      return { blob };
    },
    onSuccess: ({ blob }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: (e) => {
      console.error(e);
      try {
        handleExportHtml();
      } catch {}
    },
  });
  const isDownloading = downloadMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          Quotation Preview
        </h2>
        {isLoading && (
          <span className="text-xs text-neutral-500">Loading header…</span>
        )}
        {error && (
          <span className="text-xs text-red-600">Failed to load settings</span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={handlePrint}
          className="px-2 py-1 text-xs rounded border border-neutral-300 hover:bg-neutral-100"
        >
          Print
        </button>
        <button
          type="button"
          onClick={handleExportHtml}
          className="px-2 py-1 text-xs rounded border border-neutral-300 hover:bg-neutral-100"
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => downloadMutation.mutate()}
          disabled={isDownloading}
          className="px-2 py-1 text-xs rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-60"
        >
          {isDownloading ? "Downloading…" : "Download PDF"}
        </button>
      </div>

      <div className="border border-neutral-200 rounded-md h-[70vh] overflow-hidden bg-neutral-50">
        <iframe
          ref={iframeRef}
          title="Quotation PDF Preview"
          srcDoc={previewHtml}
          style={{ width: "100%", height: "100%", border: "0" }}
        />
      </div>

      <div className="mt-2 text-[10px] text-neutral-500">
        Preview uses a compact layout to fit more content per page.
      </div>
    </div>
  );
}
