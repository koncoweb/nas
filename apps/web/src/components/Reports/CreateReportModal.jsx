import ReportPreview from "@/components/Reports/ReportPreview";
import { reportTypeOptions } from "@/utils/reportHelpers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

export function CreateReportModal({
  show,
  onClose,
  formData,
  updateField,
  projects,
  error,
  submitting,
  onSubmit,
}) {
  const isDO = (formData?.report_type || "work_done") === "delivery_order";

  // Local state for Delivery Items rows
  const [rows, setRows] = useState([{ description: "", qty: "", unit: "" }]);
  // ADD: preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Initialize rows from formData only once when modal opens
  useEffect(() => {
    if (!show || !isDO) return;
    const text = formData?.delivery_items || "";
    if (text) {
      const lines = text.split(/\n+/).filter((l) => l.trim());
      const parsed = lines.map((line) => {
        const [left, right] = line.split("|");
        const desc = (left || line).replace(/^\s*\d+\.?\s*/, "").trim();
        let qty = "";
        let unit = "";
        if (right) {
          const parts = right.trim().split(/\s+/);
          qty = parts.shift() || "";
          unit = parts.join(" ");
        }
        return { description: desc, qty, unit };
      });
      if (parsed.length) {
        setRows(parsed);
      }
    } else {
      setRows([{ description: "", qty: "", unit: "" }]);
    }
  }, [show, isDO]); // Only run when modal opens/closes or type changes

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { description: "", qty: "", unit: "" }]);
  }, []);

  const removeRow = useCallback((index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }, []);

  // Compute delivery items text and table from rows
  const deliveryItemsText = useMemo(() => {
    if (!isDO) return "";
    const lines = (rows || [])
      .filter((r) => r.description || r.qty || r.unit)
      .map((r, idx) => {
        const no = idx + 1;
        const qty =
          r.qty !== undefined && r.qty !== null && r.qty !== "" ? r.qty : "-";
        const unit = (r.unit || "-").trim();
        const desc = (r.description || "").trim();
        return `${no}. ${desc}  |  ${qty} ${unit}`;
      });
    return lines.join("\n");
  }, [rows, isDO]);

  const deliveryItemsTable = useMemo(() => {
    if (!isDO) return [];
    return (rows || [])
      .map((r, idx) => ({
        no: idx + 1,
        description: (r.description || "").trim(),
        qty: r.qty === 0 || r.qty ? String(r.qty) : "",
        unit: (r.unit || "").trim(),
      }))
      .filter((r) => r.description || r.qty || r.unit);
  }, [rows, isDO]);

  // Create enhanced formData for preview with computed delivery items
  const enhancedFormData = useMemo(() => {
    if (!isDO) return formData;
    return {
      ...formData,
      delivery_items: deliveryItemsText,
      delivery_items_table: deliveryItemsTable,
    };
  }, [formData, isDO, deliveryItemsText, deliveryItemsTable]);

  // Handle form submit with enhanced data
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (isDO) {
        flushSync(() => {
          updateField("delivery_items", deliveryItemsText);
          updateField("delivery_items_table", deliveryItemsTable);
        });
      }
      onSubmit(e);
    },
    [isDO, deliveryItemsText, deliveryItemsTable, updateField, onSubmit],
  );

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-neutral-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      {/* widen modal to fit preview */}
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Create New Report
          </h2>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1.5 text-sm rounded-md bg-neutral-800 text-white hover:bg-neutral-900"
          >
            Preview
          </button>
        </div>

        {/* two columns: form + preview */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Project *
                  </label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => updateField("project_id", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_number} - {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Report Type *
                  </label>
                  <select
                    value={formData.report_type || "work_done"}
                    onChange={(e) => updateField("report_type", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                  >
                    {reportTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isDO && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Completion Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.completion_date}
                      onChange={(e) =>
                        updateField("completion_date", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                {isDO && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Delivery No
                      </label>
                      <input
                        type="text"
                        value={formData.delivery_number || ""}
                        onChange={(e) =>
                          updateField("delivery_number", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g. DO-2025-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Delivered Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.delivered_date || ""}
                        onChange={(e) =>
                          updateField("delivered_date", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}

                {!isDO && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Work Summary *
                    </label>
                    <textarea
                      required
                      value={formData.work_summary}
                      onChange={(e) =>
                        updateField("work_summary", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the work completed..."
                      rows={4}
                    />
                  </div>
                )}

                {isDO && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Delivery Items *
                    </label>

                    <div className="mb-3 border rounded-lg">
                      <div className="flex items-center justify-between px-3 py-2">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            Items
                          </div>
                          <div className="text-xs text-neutral-500">
                            No, Description, Qty, Unit
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={addRow}
                          className="text-sm px-3 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700"
                        >
                          + Add Item
                        </button>
                      </div>

                      {/* Header */}
                      <div className="px-3 pb-1">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-neutral-600">
                          <div className="col-span-1 text-center">No</div>
                          <div className="col-span-7">Description</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-center">Unit</div>
                        </div>
                      </div>

                      {/* Rows */}
                      <div className="px-3 pb-3">
                        {rows.map((row, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 items-start mb-2"
                          >
                            <div className="col-span-1 flex items-center justify-center text-sm text-neutral-700">
                              {idx + 1}
                            </div>
                            <div className="col-span-7">
                              <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Describe the item/material"
                                value={row.description}
                                onChange={(e) =>
                                  updateRow(idx, "description", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                className="w-full border rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={row.qty}
                                min="0"
                                step="any"
                                onChange={(e) =>
                                  updateRow(idx, "qty", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                              <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Unit"
                                value={row.unit}
                                onChange={(e) =>
                                  updateRow(idx, "unit", e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                className="text-red-600 hover:text-red-700 text-lg"
                                aria-label="Remove item"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                        {rows.length === 0 && (
                          <div className="text-sm text-neutral-500 py-6 text-center border rounded-md">
                            No items. Click "Add Item" to add.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isDO && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.delivery_notes || ""}
                      onChange={(e) =>
                        updateField("delivery_notes", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Additional delivery notes..."
                      rows={3}
                    />
                  </div>
                )}

                {!isDO && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Materials Used
                      </label>
                      <textarea
                        value={formData.materials_used}
                        onChange={(e) =>
                          updateField("materials_used", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="List materials and quantities used..."
                        rows={3}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Recommendations
                      </label>
                      <textarea
                        value={formData.recommendations}
                        onChange={(e) =>
                          updateField("recommendations", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Future maintenance or improvement recommendations..."
                        rows={3}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Customer Feedback
                      </label>
                      <textarea
                        value={formData.customer_feedback}
                        onChange={(e) =>
                          updateField("customer_feedback", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Customer comments and satisfaction..."
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Issues Encountered
                      </label>
                      <textarea
                        value={formData.issues_encountered}
                        onChange={(e) =>
                          updateField("issues_encountered", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Any problems or challenges faced..."
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Report"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {previewOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-base font-semibold text-neutral-900">
                  Preview Report
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
                <ReportPreview
                  formData={enhancedFormData}
                  projects={projects}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
