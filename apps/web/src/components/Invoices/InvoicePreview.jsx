"use client";

import { useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function InvoicePreview({
  invoice,
  customers = [],
  projects = [],
}) {
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
  const primary = companySettings.primary_color || "#0F4C81";
  const lightPrimary = companySettings.primary_light || "#E6F0FA";

  const selectedProject = useMemo(() => {
    if (!invoice?.project_id) return null;
    return (
      projects.find((p) => String(p.id) === String(invoice.project_id)) || null
    );
  }, [projects, invoice?.project_id]);

  const customer = useMemo(() => {
    if (invoice?.customer_id) {
      return (
        customers.find((c) => String(c.id) === String(invoice.customer_id)) ||
        null
      );
    }
    if (selectedProject && selectedProject.customer_id) {
      return (
        customers.find(
          (c) => String(c.id) === String(selectedProject.customer_id),
        ) || null
      );
    }
    return null;
  }, [customers, invoice?.customer_id, selectedProject]);

  const calc = useMemo(() => {
    const subtotal = (invoice?.line_items || []).reduce(
      (s, it) =>
        s + parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0),
      0,
    );
    const taxRate = parseFloat(invoice?.tax_rate || 0) / 100;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [invoice?.line_items, invoice?.tax_rate]);

  const currency = (invoice?.currency || "IDR").toUpperCase();
  const fmt = (n) => {
    if (currency === "USD")
      return (n || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    if (currency === "SGD")
      return (n || 0).toLocaleString("en-SG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return (n || 0).toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
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

  const previewHtml = useMemo(() => {
    const headerLogoUrl = companySettings.logo_url || "";

    const rowsHtml = (invoice?.line_items || [])
      .map((it) => {
        const qty = parseFloat(it.quantity || 0).toLocaleString("id-ID");
        const unitPrice = parseFloat(it.unit_price || 0);
        const total = unitPrice * parseFloat(it.quantity || 0);
        return `
          <tr>
            <td class="tbl-desc">${it.description || "-"}</td>
            <td class="tbl-qty">${qty}</td>
            <td class="tbl-price">${fmt(unitPrice)}</td>
            <td class="tbl-total">${fmt(total)}</td>
          </tr>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice Preview</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:0}
  /* compact */
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
  .scope-table th,.scope-table td{border:1px solid #000;padding:1px 2px;vertical-align:top; line-height:1.2}
  .scope-table th{background:${lightPrimary};font-weight:bold;text-align:center;font-size:11px}
  .tbl-qty{width:70px;text-align:center}
  .tbl-price,.tbl-total{width:120px;text-align:right}
  .tbl-desc{width:auto; word-break:break-word; white-space:pre-wrap; line-height:1.15; padding-top:1px; padding-bottom:1px}
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
        <div class="page-title">INVOICE</div>
        <div class="page-ref">${invoice?.invoice_number || "(Draft)"}</div>
      </div>
      <div class="section">
        <div class="section-title" style="text-decoration:none">Bill To</div>
        <div><strong>${customer?.company_name || "(Select project)"}</strong></div>
        ${customer?.contact_name ? `<div>Attn: ${customer.contact_name}</div>` : ""}
        ${customer?.email ? `<div>${customer.email}</div>` : ""}
        ${customer?.phone ? `<div>${customer.phone}</div>` : ""}
      </div>
      <div class="section">
        <div class="section-title" style="text-decoration:none">Invoice Details</div>
        <div>Date: ${formatDate(invoice?.issue_date)}</div>
        <div>Due Date: ${formatDate(invoice?.due_date)}</div>
        <div>Payment Terms: ${invoice?.payment_terms || "-"}</div>
        ${selectedProject?.project_number ? `<div>Project: ${selectedProject.project_number}${selectedProject.title ? ` — ${selectedProject.title}` : ""}</div>` : ""}
      </div>

      <table class="scope-table" style="margin-top:1px">
        <thead>
          <tr>
            <th class="tbl-desc">Description</th>
            <th class="tbl-qty">Qty</th>
            <th class="tbl-price">Unit Price (${currency})</th>
            <th class="tbl-total">Total (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="4" style="border:1px solid #000;padding:2px">No items</td></tr>`}
        </tbody>
      </table>

      <div class="section" style="display:flex;justify-content:flex-end">
        <table style="width:340px;border-collapse:collapse">
          <tbody>
            <tr>
              <td style="padding:3px;border-bottom:1px solid #e5e5e5;font-weight:bold">Subtotal</td>
              <td style="padding:3px;border-bottom:1px solid #e5e5e5;text-align:right">${fmt(calc.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:3px;border-bottom:1px solid #e5e5e5;font-weight:bold">Tax (${parseFloat(invoice?.tax_rate || 0).toFixed(2)}%)</td>
              <td style="padding:3px;border-bottom:1px solid #e5e5e5;text-align:right">${fmt(calc.taxAmount)}</td>
            </tr>
            <tr>
              <td style="padding:3px;border-bottom:1px solid #e5e5e5;font-weight:bold">Total</td>
              <td style="padding:3px;border-bottom:1px solid #e5e5e5;text-align:right"><strong>${fmt(calc.total)}</strong></td>
            </tr>
          </tbody>
        </table>
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
  }, [
    companySettings,
    headerAddress,
    invoice,
    customer,
    selectedProject,
    calc,
    currency,
  ]);

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
  const suggestedName = `invoice-${sanitize(invoice?.invoice_number || "draft")}.pdf`;

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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-neutral-900">Print Preview</h3>
        {isLoading && (
          <span className="text-xs text-neutral-500">Loading header…</span>
        )}
        {error && <span className="text-xs text-red-600">Header failed</span>}
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

      <div className="border border-neutral-200 rounded-md h-[65vh] overflow-hidden bg-neutral-50">
        <iframe
          ref={iframeRef}
          title="Invoice PDF Preview"
          srcDoc={previewHtml}
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </div>
  );
}
