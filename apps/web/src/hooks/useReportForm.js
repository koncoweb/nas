import { useState } from "react";

export function useReportForm(initialReport, onSuccess) {
  const [formData, setFormData] = useState(initialReport);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    // Use functional update to avoid stale state and merge multiple rapid updates
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialReport);
    setError("");
  };

  // Helper to serialize delivery_items_table -> delivery_items text
  const serializeDeliveryItems = (table) => {
    if (!Array.isArray(table)) return "";
    const lines = table
      .filter((r) => r && (r.description || r.qty || r.unit))
      .map((r, idx) => {
        const no = r.no ?? idx + 1;
        const desc = (r.description || "").trim();
        const qty =
          r.qty !== undefined && r.qty !== null && r.qty !== "" ? r.qty : "-";
        const unit = (r.unit || "-").trim();
        return `${no}. ${desc}  |  ${qty} ${unit}`;
      });
    return lines.join("\n");
  };

  const validateForm = () => {
    const type = formData.report_type || "work_done";

    if (formData.project_id !== undefined && !formData.project_id) {
      setError("Project selection is required");
      return false;
    }

    if (type === "work_done") {
      if (!formData.work_summary?.trim()) {
        setError("Work summary is required");
        return false;
      }
      if (!formData.completion_date) {
        setError("Completion date is required");
        return false;
      }
    } else if (type === "delivery_order") {
      if (!formData.delivered_date) {
        setError("Delivered date is required");
        return false;
      }
      const hasText = !!(
        formData.delivery_items && String(formData.delivery_items).trim()
      );
      const hasTable = Array.isArray(formData.delivery_items_table)
        ? formData.delivery_items_table.some(
            (r) =>
              (r?.description || r?.qty || r?.unit) &&
              String(r?.description || "").trim().length > 0,
          )
        : false;
      if (!hasText && !hasTable) {
        setError("Delivery items are required");
        return false;
      }
    }

    return true;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError("");

      // Prepare payload; ensure delivery_items is populated for DO
      let payload = { ...formData };
      if ((payload.report_type || "work_done") === "delivery_order") {
        const needsText =
          !payload.delivery_items || !String(payload.delivery_items).trim();
        if (needsText && Array.isArray(payload.delivery_items_table)) {
          payload.delivery_items = serializeDeliveryItems(
            payload.delivery_items_table,
          );
        }
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create report");
      }

      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating report:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpdate = async (reportId) => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError("");

      // Prepare payload; ensure delivery_items is populated for DO
      let payload = { ...formData };
      if ((payload.report_type || "work_done") === "delivery_order") {
        const needsText =
          !payload.delivery_items || !String(payload.delivery_items).trim();
        if (needsText && Array.isArray(payload.delivery_items_table)) {
          payload.delivery_items = serializeDeliveryItems(
            payload.delivery_items_table,
          );
        }
      }

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update report");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating report:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    updateField,
    resetForm,
    submitting,
    error,
    setError,
    submitCreate,
    submitUpdate,
  };
}
