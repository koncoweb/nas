import { useQuotationDetail } from "@/hooks/useQuotationDetail";
import {
  formatCurrency,
  formatDate,
  getStatusBadge,
} from "@/utils/quotationFormatters";
import { Header } from "@/components/QuotationDetail/Header";
import { PageHeader } from "@/components/QuotationDetail/PageHeader";
import { ActionButtons } from "@/components/QuotationDetail/ActionButtons";
import { ErrorState } from "@/components/QuotationDetail/ErrorState";
import { LoadingState } from "@/components/QuotationDetail/LoadingState";
import { PrintDocument } from "@/components/QuotationDetail/PrintDocument/PrintDocument";
import { useState, useMemo, useRef, useCallback } from "react";

function QuotationDetailPage({ params }) {
  const quotationId = params.id;
  const {
    userLoading,
    userProfile,
    quotation,
    companySettings,
    loading,
    error,
  } = useQuotationDetail(quotationId);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const iframeRef = useRef(null); // add ref to control print

  const buildPdfUrl = useMemo(() => {
    if (!quotation) return null;
    const params = new URLSearchParams();
    const currency = (
      quotation?.currency ||
      companySettings?.default_currency ||
      "IDR"
    ).toUpperCase();
    if (currency) params.set("currency", currency);
    if (companySettings?.primary_color)
      params.set("primary", encodeURIComponent(companySettings.primary_color));
    if (companySettings?.primary_light)
      params.set("light", encodeURIComponent(companySettings.primary_light));
    if (companySettings?.logo_url)
      params.set("logo", encodeURIComponent(companySettings.logo_url));
    const url = `/api/quotations/${parseInt(quotationId, 10) || quotationId}/pdf${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return url;
  }, [quotation, companySettings, quotationId]);

  const handlePreview = () => {
    if (!buildPdfUrl) return;
    setPreviewUrl(buildPdfUrl);
    setPreviewOpen(true);
  };

  const handlePrint = useCallback(() => {
    // Prefer printing the iframe content so it prints the single page cleanly
    const node = iframeRef.current;
    if (node && node.contentWindow) {
      node.contentWindow.focus();
      node.contentWindow.print();
      return;
    }
    const url = buildPdfUrl;
    if (url) window.open(url, "_blank");
  }, [buildPdfUrl]);

  const handleExportPDF = useCallback(async () => {
    // Open the PDF endpoint in a new tab; users can Save as PDF
    try {
      const url = buildPdfUrl;
      if (url) window.open(url, "_blank");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  }, [buildPdfUrl]);

  if (userLoading || !userProfile || !companySettings || loading) {
    return <LoadingState />;
  }

  if (error || !quotation) {
    return <ErrorState error={error} userProfile={userProfile} />;
  }

  const userRole = userProfile?.user_role || "sales";
  const canEdit = userRole === "leader" || userRole === "sales";
  const showPricing = userRole !== "engineer";

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header userProfile={userProfile} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-none print:px-0 print:py-0">
        <PageHeader quotation={quotation} getStatusBadge={getStatusBadge} />

        <ActionButtons
          quotationId={quotationId}
          quotation={quotation}
          canEdit={canEdit}
          onPreview={handlePreview}
          onPrint={handlePrint}
          onExportPDF={handleExportPDF}
        />

        {/* NOTE: keep inline print view for now; can be removed later if desired */}
        <PrintDocument
          quotation={quotation}
          companySettings={companySettings}
          showPricing={showPricing}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col"
            style={{
              height: "95vh",
              width: "min(100%, calc(95vh * 0.707))", // keep A4 ratio (210/297)
            }}
          >
            <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b">
              <h3 className="text-sm font-semibold text-neutral-900">
                Preview Quotation
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen(false);
                    setPreviewUrl("");
                  }}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1">
              {previewUrl ? (
                <iframe
                  ref={iframeRef}
                  title="Quotation Preview"
                  src={previewUrl}
                  className="w-full h-full"
                />
              ) : (
                <div className="p-4 text-sm text-neutral-600">
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationDetailPage;
