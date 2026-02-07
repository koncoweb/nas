import { useMemo } from "react";
import { PrintStyles } from "./PrintStyles";

export function PrintDocument({
  quotation,
  companySettings,
  showPricing, // kept for API param compatibility in future
  formatCurrency, // not used when embedding API HTML
  formatDate, // not used when embedding API HTML
}) {
  // Build a URL to the server HTML (same generator as Export PDF)
  const pdfPreviewUrl = useMemo(() => {
    if (!quotation?.id) return null;
    const params = new URLSearchParams();
    // pass currency preference when available
    const currency = (
      quotation?.currency ||
      companySettings?.default_currency ||
      "IDR"
    ).toUpperCase();
    if (currency) params.set("currency", currency);
    // pass brand overrides to ensure perfect match
    if (companySettings?.primary_color)
      params.set("primary", encodeURIComponent(companySettings.primary_color));
    if (companySettings?.primary_light)
      params.set("light", encodeURIComponent(companySettings.primary_light));
    if (companySettings?.logo_url)
      params.set("logo", encodeURIComponent(companySettings.logo_url));
    return `/api/quotations/${quotation.id}/pdf${params.toString() ? `?${params.toString()}` : ""}`;
  }, [
    quotation?.id,
    quotation?.currency,
    companySettings?.default_currency,
    companySettings?.primary_color,
    companySettings?.primary_light,
    companySettings?.logo_url,
  ]);

  const primary =
    (companySettings && companySettings.primary_color) || "#0F4C81";

  return (
    <>
      {/* Embedded preview uses the exact same HTML/CSS as Export PDF */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 print:shadow-none print:border-none print:rounded-none">
        <div className="border-b border-neutral-200 px-4 py-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">
            Print Preview
          </h3>
          <span className="text-xs text-neutral-500">
            Letterhead and layout mirror Export PDF
          </span>
        </div>
        <div className="h-[70vh] w-full">
          {pdfPreviewUrl ? (
            <iframe
              title="Quotation Print Preview"
              src={pdfPreviewUrl}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                background: "#fff",
              }}
            />
          ) : (
            <div className="p-4 text-sm text-neutral-600">
              No preview available
            </div>
          )}
        </div>
      </div>
      {/* Keep PrintStyles loaded in case we fall back to on-page print in the future */}
      <PrintStyles />
    </>
  );
}
