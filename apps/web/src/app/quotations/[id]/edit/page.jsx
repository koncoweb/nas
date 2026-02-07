"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import useUser from "@/utils/useUser";
import { useQuotationForm } from "@/hooks/useQuotationForm";
import { useQuotationData } from "@/hooks/useQuotationData";
import { calculateQuotationTotals } from "@/utils/quotationCalculations";
import { Header } from "@/components/QuotationForm/Header";
import { PageHeader } from "@/components/QuotationForm/PageHeader";
import { AlertMessage } from "@/components/QuotationForm/AlertMessage";
import { BasicInformation } from "@/components/QuotationForm/BasicInformation";
import ScopeGroups from "@/components/QuotationForm/ScopeGroups";
import Exclusions from "@/components/QuotationForm/Exclusions";
import QuotationPreview from "@/components/QuotationForm/QuotationPreview";
import { TermsConditions } from "@/components/QuotationForm/TermsConditions";
import { QuotationSummary } from "@/components/QuotationForm/QuotationSummary";

export default function EditQuotationPage({ params }) {
  const router = useRouter();
  const quotationId = params.id;
  const { data: user, loading: userLoading } = useUser();
  const { customers, materials, loading: dataLoading } = useQuotationData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [quotationLoading, setQuotationLoading] = useState(true);
  const [quotationData, setQuotationData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    formData,
    handleInputChange,
    scopeGroups,
    addGroup,
    removeGroup,
    changeGroupTitle,
    addGroupItem,
    removeGroupItem,
    changeGroupItem,
    flattenGroupsToItems,
    groupsToScopeWork,
    setFormData,
    setScopeGroups,
  } = useQuotationForm();

  // Fetch existing quotation data
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setQuotationLoading(true);
        const response = await fetch(`/api/quotations/${quotationId}`);

        if (!response.ok) {
          throw new Error(
            `When fetching /api/quotations/${quotationId}, the response was [${response.status}] ${response.statusText}`,
          );
        }

        const data = await response.json();
        const quotation = data.quotation;
        setQuotationData(data);

        // Populate form with existing data and include fields used by the new create page
        setFormData((prev) => ({
          ...prev,
          customer_id: quotation.customer_id || "",
          title: quotation.title || "",
          description: quotation.description || "",
          service_type: quotation.service_type || "",
          vessel_name: quotation.vessel_name || "",
          location: quotation.location || "",
          revision_number: quotation.revision_number || 0,
          labor_hours: quotation.labor_hours || 0,
          labor_rate: quotation.labor_rate || 0,
          profit_margin: quotation.profit_margin || 0,
          validity_days: quotation.validity_days || 7,
          payment_percentage: quotation.payment_percentage || 100,
          payment_timing: quotation.payment_timing || "Upon work completion",
          time_estimation_supply: quotation.time_estimation_supply || "",
          time_estimation_work: quotation.time_estimation_work || "",
          other_terms: quotation.other_terms || "",
          valid_until: quotation.valid_until || "",
          notes: quotation.notes || "",
          currency: (quotation.currency || "IDR").toUpperCase(),
          issue_date: quotation.created_at
            ? String(quotation.created_at).slice(0, 10)
            : prev.issue_date || "",
        }));

        // Build scopeGroups from line_items (using scope_group) or fallback to scope_work titles
        const items = Array.isArray(quotation.line_items)
          ? quotation.line_items
          : [];
        const map = new Map();
        items.forEach((it) => {
          const title = (it.scope_group || "").trim();
          if (!map.has(title)) map.set(title, []);
          map.get(title).push({
            description: it.description || "",
            quantity: it.quantity || 1,
            unit_type: it.unit_type || "Unit",
            unit_price: it.unit_price || 0,
            item_type: it.item_type || "material",
            material_id: it.material_id || null,
          });
        });
        let groups = Array.from(map.entries()).map(([title, arr]) => ({
          title,
          items: arr,
        }));
        if (!groups.length) {
          const sw = Array.isArray(quotation.scope_work)
            ? quotation.scope_work
            : [];
          groups = sw.map((s) => ({ title: s.description || "", items: [] }));
        }
        if (groups.length) setScopeGroups(groups);
      } catch (err) {
        console.error("Error fetching quotation:", err);
        setError("Failed to load quotation data");
      } finally {
        setQuotationLoading(false);
      }
    };

    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId, setFormData, setScopeGroups]);

  // derive line items from groups to match create page behaviour
  const flatItems = flattenGroupsToItems();
  const calculations = calculateQuotationTotals(flatItems, formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Compose Other Terms with Exclusions like in the create page
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

      const payload = {
        customer_id: parseInt(formData.customer_id) || null,
        title: formData.title,
        description: formData.description,
        service_type: formData.service_type,
        vessel_name: formData.vessel_name,
        location: formData.location,
        revision_number: parseInt(formData.revision_number) || 0,
        labor_hours: parseFloat(formData.labor_hours) || 0,
        labor_rate: parseFloat(formData.labor_rate) || 0,
        materials_cost: calculations.materialsTotal,
        profit_margin: parseFloat(formData.profit_margin) || 0,
        validity_days: parseInt(formData.validity_days) || 7,
        payment_percentage: parseFloat(formData.payment_percentage) || 100,
        payment_timing: formData.payment_timing,
        time_estimation_supply: formData.time_estimation_supply,
        time_estimation_work: formData.time_estimation_work,
        other_terms: composedOtherTerms,
        valid_until: formData.valid_until,
        notes: formData.notes,
        currency: (formData.currency || "IDR").toUpperCase(),
        line_items: flattenGroupsToItems(),
        scope_work: groupsToScopeWork(),
      };

      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `When updating quotation, the response was [${response.status}] ${response.statusText}`,
        );
      }

      const result = await response.json();
      setSuccess("Quotation updated successfully!");

      // Redirect to quotation detail page after a short delay
      setTimeout(() => {
        router.push(`/quotations/${quotationId}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating quotation:", err);
      setError(err.message || "Failed to update quotation");
    } finally {
      setLoading(false);
    }
  };

  const handleLineItemChangeWithMaterials = (index, field, value) => {
    // This is a placeholder for future use if needed
  };

  if (userLoading || dataLoading || quotationLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading quotation...</p>
        </div>
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
            You don't have permission to edit quotations.
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

  if (!quotationData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Quotation Not Found
          </h2>
          <p className="text-neutral-600 mb-4">
            The quotation you're looking for doesn't exist.
          </p>
          <a href="/quotations" className="text-primary-600 hover:text-primary-700">
            Back to Quotations
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Edit Quotation"
          subtitle={`Editing ${quotationData.quotation.quote_number}`}
          onBack={() => router.back()}
        />

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

              {/* New grouped editor (matches create page) */}
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

            {/* Sidebar: summary + preview trigger */}
            <div className="lg:col-span-1 space-y-6">
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
                submitButtonText="Update Quotation"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-base font-semibold text-neutral-900">
                Preview Quotation
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <QuotationPreview
                formData={formData}
                scopeGroups={scopeGroups}
                customers={customers}
                calculations={calculations}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
