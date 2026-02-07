"use client";

import { useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function ReportPreview({ formData, projects = [] }) {
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

  const project = useMemo(() => {
    if (!formData?.project_id) return null;
    return (
      projects.find((p) => String(p.id) === String(formData.project_id)) || null
    );
  }, [projects, formData?.project_id]);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";

  const headerAddress = useMemo(() => {
    return [
      companySettings.address_line1 || "Jl. Gajah Mada – Tiban Baru",
      companySettings.address_line2 || "Ruko Onassis Blok A  No.  05",
      companySettings.address_line3 || "Tiban Baru – Batam",
      companySettings.phone || "Tlp. 0778 8011380",
      companySettings.email || "",
    ]
      .filter(Boolean)
      .join("<br/>");
  }, [companySettings]);

  const escapeHtml = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");

  const buildDraftDocNo = (isDO) => {
    const prefix = isDO ? "DO" : "WDR";
    const dateStr =
      (isDO ? formData?.delivered_date : formData?.completion_date) ||
      new Date().toISOString().slice(0, 10);
    const dt = new Date(dateStr);
    const ym = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const quoteRef = (project?.quote_number || project?.project_number || "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `${prefix}-${ym}-${quoteRef || "REF"}`;
  };

  // Prefer a logo from the form (if provided), then from settings
  const resolvedLogoUrl = (
    formData?.logo_url ||
    companySettings.logo_url ||
    ""
  ).trim();

  // Try to read structured table from formData first; fallback to parsing text
  const getDOItems = () => {
    if (
      Array.isArray(formData?.delivery_items_table) &&
      formData.delivery_items_table.length
    ) {
      return formData.delivery_items_table
        .filter((r) => r && (r.description || r.qty || r.unit))
        .map((r, idx) => ({
          no: r.no ?? idx + 1,
          description: r.description ?? "",
          qty: r.qty ?? "",
          unit: r.unit ?? "",
        }));
    }
    const text = formData?.delivery_items || "";
    const lines = text.split(/\n+/).filter((l) => l.trim());
    return lines.map((line, idx) => {
      // expected pattern: "1. desc  |  qty unit" (best effort parsing)
      const [left, right] = line.split("|");
      const desc = (left || line).replace(/^\s*\d+\.?\s*/, "").trim();
      let qty = "";
      let unit = "";
      if (right) {
        const parts = right.trim().split(/\s+/);
        qty = parts.shift() || "";
        unit = parts.join(" ");
      }
      return { no: idx + 1, description: desc, qty, unit };
    });
  };

  const sectionHtml = (title, content) =>
    content
      ? `
        <div class="section">
          <div class="section-title">${title}</div>
          <div style="white-space:pre-wrap">${content}</div>
        </div>`
      : "";

  const previewHtml = useMemo(() => {
    const primary = companySettings.primary_color || "#0F4C81";
    const headerLogoUrl = resolvedLogoUrl; // use resolved logo url
    const isDO = (formData?.report_type || "work_done") === "delivery_order";

    const docNo = formData?.delivery_number || buildDraftDocNo(isDO);

    const infoRows = isDO
      ? `
        <div class="section">
          <div class="section-title" style="text-decoration:none">Delivery</div>
          <div>Delivery No: <strong>${escapeHtml(docNo || "(Draft)")}</strong></div>
          <div>Delivered Date: ${escapeHtml(formatDate(formData?.delivered_date))}</div>
        </div>
      `
      : `
        <div class="section">
          <div class="section-title" style="text-decoration:none">Project</div>
          <div><strong>${escapeHtml(project?.title || "(Select project)")}</strong></div>
          <div>Project No: ${escapeHtml(project?.project_number || "-")}</div>
          <div>Report No: <strong>${escapeHtml(docNo || "(Draft)")}</strong></div>
          <div>Completion Date: ${escapeHtml(formatDate(formData?.completion_date))}</div>
        </div>
      `;

    let bodySections = "";

    if (isDO) {
      const items = getDOItems();
      const rowsHtml = items
        .map(
          (it) => `
          <tr>
            <td class="cell no">${escapeHtml(it.no)}</td>
            <td class="cell desc">${escapeHtml(it.description)}</td>
            <td class="cell qty">${escapeHtml(it.qty)}</td>
            <td class="cell unit">${escapeHtml(it.unit)}</td>
          </tr>`,
        )
        .join("");

      const itemsTable = `
        <div class="section">
          <div class="section-title">Delivery Items</div>
          <table class="items-table">
            <thead>
              <tr>
                <th class="cell no">No</th>
                <th class="cell desc">Description</th>
                <th class="cell qty">Qty</th>
                <th class="cell unit">Unit</th>
              </tr>
            </thead>
            <tbody>${rowsHtml || `<tr><td class="cell no">-</td><td class="cell desc">-</td><td class="cell qty">-</td><td class="cell unit">-</td></tr>`}</tbody>
          </table>
        </div>`;

      const notesHtml = sectionHtml(
        "Notes",
        escapeHtml(formData?.delivery_notes),
      );
      bodySections = `${itemsTable}${notesHtml}`;
    } else {
      bodySections = `
        ${sectionHtml("Work Summary", escapeHtml(formData?.work_summary))}
        ${sectionHtml("Materials Used", escapeHtml(formData?.materials_used))}
        ${sectionHtml("Recommendations", escapeHtml(formData?.recommendations))}
        ${sectionHtml("Issues Encountered", escapeHtml(formData?.issues_encountered))}
        ${sectionHtml("Customer Feedback", escapeHtml(formData?.customer_feedback))}
      `;
    }

    const titleText = isDO ? "DELIVERY ORDER" : "PROJECT REPORT";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Report Preview</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:0}
  /* tighter base text */
  body{font-family:'Times New Roman', serif;font-size:11px;line-height:1.25;color:#000;background:#fff}
  .page{height:297mm;width:210mm;position:relative;overflow:hidden}
  /* Compact page paddings */
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
  .section{margin:6px 0}
  .section-title{font-size:11px;font-weight:bold;text-decoration:underline;color:${primary};margin-bottom:4px}
  /* Delivery Items table styling (more compact) */
  .items-table{width:100%;border-collapse:collapse;margin-top:1px}
  .items-table .cell{border:1px solid ${primary};padding:1px 2px;vertical-align:top;line-height:1.1}
  .items-table thead th{font-weight:bold;text-align:center;background:#f7fafc;padding:1px 2px}
  .items-table .no{width:6%;text-align:center}
  .items-table .desc{width:64%}
  .items-table .qty{width:15%;text-align:center;white-space:nowrap}
  .items-table .unit{width:15%;text-align:center;white-space:nowrap}
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
            ? `<div class="company-logo"><img src="${headerLogoUrl}" alt="Company Logo" onerror="this.style.display='none'"/></div>`
            : ""
        }
        <div class="company-info">
          <div class="company-address">${headerAddress}</div>
        </div>
      </div>
      <div class="rule"><div class="line-thick"></div><div class="line-thin"></div></div>
      <div class="page-header">
        <div class="page-title">${titleText}</div>
        <div class="page-ref">${escapeHtml(docNo || "(Draft)")}</div>
      </div>

      ${infoRows}

      ${bodySections}

      <div class="section" style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-top:8px">
        <div>
          <div>Prepared by,</div>
          <div><strong>${escapeHtml(companySettings.director_name || "Cucup Supriatna")}</strong></div>
          <div>${escapeHtml(companySettings.director_title || "Commercial Manager")}</div>
        </div>
        <div class="text-sm">Customer signature will appear after submission.</div>
      </div>
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
  }, [companySettings, headerAddress, project, formData, resolvedLogoUrl]);

  // Toolbar actions (Print, Export HTML, Download PDF)
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
  const isDO = (formData?.report_type || "work_done") === "delivery_order";
  const draftDocNo = buildDraftDocNo(isDO);
  const suggestedName = isDO
    ? formData?.delivery_number
      ? `do-${sanitize(formData.delivery_number)}.pdf`
      : `do-${sanitize(draftDocNo)}.pdf`
    : `report-draft.pdf`;

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
        // Fallback to Export HTML for manual save as PDF
        handleExportHtml();
      } catch {}
    },
  });

  const isDownloading = downloadMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">Print Preview</h3>
        {isLoading && (
          <span className="text-[10px] text-neutral-500">Loading header…</span>
        )}
        {error && (
          <span className="text-[10px] text-red-600">Header failed</span>
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

      <div className="border border-neutral-200 rounded-md h-[60vh] overflow-hidden bg-neutral-50">
        <iframe
          ref={iframeRef}
          title="Report PDF Preview"
          srcDoc={previewHtml}
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </div>
  );
}
