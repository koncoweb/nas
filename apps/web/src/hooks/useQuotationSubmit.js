import { useState } from "react";

export function useQuotationSubmit(router) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitQuotation = async (
    formData,
    lineItems,
    scopeWork,
    calculations,
    scope_of_work_groups = [],
  ) => {
    if (!formData.customer_id || !formData.title) {
      setError("Customer and title are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          materials_cost: calculations.materialsTotal,
          line_items: (lineItems || []).filter((item) =>
            (item.description || "").trim(),
          ),
          scope_work: (scopeWork || []).filter((work) =>
            (work.description || "").trim(),
          ),
          // NEW hierarchical payload (backend flattens it if present)
          scope_of_work_groups,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create quotation");
      }

      const data = await response.json();
      setSuccess("Quotation created successfully!");

      setTimeout(() => {
        router.push(`/quotations`);
      }, 1500);
    } catch (err) {
      console.error("Error creating quotation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, success, submitQuotation };
}
