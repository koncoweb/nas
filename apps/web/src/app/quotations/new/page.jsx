"use client";

import { useRouter } from "@/utils/navigation";
import useUser from "@/utils/useUser";
import { useQuotationForm } from "@/hooks/useQuotationForm";
import { useQuotationData } from "@/hooks/useQuotationData";
import { useQuotationSubmit } from "@/hooks/useQuotationSubmit";
import { calculateQuotationTotals } from "@/utils/quotationCalculations";
import { Header } from "@/components/QuotationForm/Header";
import { PageHeader } from "@/components/QuotationForm/PageHeader";
import { AlertMessage } from "@/components/QuotationForm/AlertMessage";
import { BasicInformation } from "@/components/QuotationForm/BasicInformation";
import ScopeGroups from "@/components/QuotationForm/ScopeGroups";
import { TermsConditions } from "@/components/QuotationForm/TermsConditions";
import { QuotationSummary } from "@/components/QuotationForm/QuotationSummary";
import Exclusions from "@/components/QuotationForm/Exclusions";
// keep QuotationPreview import for modal only now
import QuotationPreview from "@/components/QuotationForm/QuotationPreview";
import { useState, useRef, useCallback } from "react";

export default function NewQuotationPage() {
  const router = useRouter();
  const { data: user, loading: userLoading } = useUser();
  const { customers, materials, loading: dataLoading } = useQuotationData();
  const { loading, error, success, submitQuotation } =
    useQuotationSubmit(router);
  // preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const iframeRef = useRef(null);

  const {
    formData,
    scopeGroups,
    handleInputChange,
    addGroup,
    removeGroup,
    changeGroupTitle,
    addGroupItem,
    removeGroupItem,
    changeGroupItem,
    flattenGroupsToItems,
    groupsToScopeWork,
    setFormData,
  } = useQuotationForm();

  // derive line items from groups for totals/summary
  const flatItems = flattenGroupsToItems();
  const calculations = calculateQuotationTotals(flatItems, formData);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // compose Other Terms with Exclusions
    let composedOtherTerms = formData.other_terms || "";
    const ex = Array.isArray(formData.exclusions) ? formData.exclusions : [];
    const exOther = (formData.exclusions_other || "").trim();
    if (ex.length || exOther) {
      const lines = [...ex, ...(exOther ? [exOther] : [])];
      const block = `\nExclusions:\n- ${lines.join("\n- ")}`;
      composedOtherTerms = composedOtherTerms
        ? `${composedOtherTerms}\n${block}`
        : block;
    }

    // Build payload using grouped structure
    const scope_of_work_groups = scopeGroups.map((g) => ({
      title: g.title,
      items: g.items,
    }));

    await submitQuotation(
      { ...formData, other_terms: composedOtherTerms },
      flatItems, // still send flattened for compatibility
      groupsToScopeWork(), // also store group titles into scope_work
      calculations,
      // pass grouped payload in body via submit hook extension (kept b/c POST supports it)
      // NOTE: we will extend submit hook to include this field
      scope_of_work_groups,
    );
  };

  const handlePrintPreview = useCallback(() => {
    const node = iframeRef.current;
    if (node && node.contentWindow) {
      node.contentWindow.focus();
      node.contentWindow.print();
    }
  }, []);

  if (userLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-neutral-600 mb-4">
            Please sign in to access this page.
          </p>
          <a
            href="/account/signin"
            className="text-primary-600 hover:text-primary-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const userRole = user.user_role || "sales";
  if (userRole !== "leader" && userRole !== "sales") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Access Denied
          </h2>
          <p className="text-neutral-600 mb-4">
            You don't have permission to create quotations.
          </p>
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader onBack={() => router.back()} />

        <AlertMessage type="success" message={success} />
        <AlertMessage type="error" message={error} />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <BasicInformation
                formData={formData}
                customers={customers}
                onInputChange={handleInputChange}
              />

              {/* NEW hierarchical groups editor replaces old Scope + Items */}
              <ScopeGroups
                groups={scopeGroups}
                onAddGroup={addGroup}
                onRemoveGroup={removeGroup}
                onChangeGroupTitle={changeGroupTitle}
                onAddItem={addGroupItem}
                onRemoveItem={removeGroupItem}
                onChangeItem={changeGroupItem}
                formData={formData}
              />

              <Exclusions formData={formData} setFormData={setFormData} />

              <TermsConditions
                formData={formData}
                onInputChange={handleInputChange}
              />
            </div>

            {/* Sidebar: summary and preview trigger */}
            <div className="lg:col-span-1 space-y-6">
              {/* Preview button card */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-900">
                    Preview
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="px-3 py-1.5 rounded-md bg-neutral-800 text-white text-sm hover:bg-neutral-900"
                  >
                    Open Preview
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Opens a modal with the latest layout.
                </p>
              </div>

              <QuotationSummary
                calculations={calculations}
                formData={formData}
                loading={loading}
                onCancel={() => router.back()}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col"
            style={{ height: "95vh", width: "min(100%, calc(95vh * 0.707))" }}
          >
            <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b">
              <h3 className="text-sm font-semibold text-neutral-900">
                Preview Quotation
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPreview}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Print
                </button>
                <button
                  type="button"
                  disabled
                  title="Export PDF will be available after saving the quotation."
                  className="px-2 py-1 text-sm rounded-md border border-neutral-200 text-neutral-400 cursor-not-allowed"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 p-2 sm:p-3">
              <div className="border border-neutral-200 rounded-md h-full overflow-hidden bg-neutral-50">
                <iframe
                  ref={iframeRef}
                  title="Quotation Preview"
                  srcDoc="<!DOCTYPE html><html><head><meta charset='utf-8'></head><body></body></html>"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    display: "none",
                  }}
                />
                {/* Render dedicated preview so we keep consistent design */}
                <QuotationPreview
                  formData={formData}
                  scopeGroups={scopeGroups}
                  customers={customers}
                  calculations={calculations}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
