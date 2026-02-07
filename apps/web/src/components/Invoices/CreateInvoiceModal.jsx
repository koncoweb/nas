import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  paymentTermsOptions,
  calculateTotals,
  formatCurrency,
} from "@/utils/invoiceHelpers";
import InvoicePreview from "@/components/Invoices/InvoicePreview";

export function CreateInvoiceModal({
  show,
  onClose,
  onSubmit,
  creating,
  error,
  newInvoice,
  setNewInvoice,
  updateLineItem,
  addLineItem,
  removeLineItem,
  customers,
  projects,
}) {
  // Only allow selecting projects that are completed
  const completedProjects = Array.isArray(projects)
    ? projects.filter((p) => p?.status === "completed")
    : [];

  // Selected project (if any)
  const selectedProject = useMemo(() => {
    if (!newInvoice?.project_id) return null;
    return (
      completedProjects.find(
        (p) => String(p.id) === String(newInvoice.project_id),
      ) || null
    );
  }, [completedProjects, newInvoice?.project_id]);

  // When project changes, auto-fill customer_id from the project and lock customer selection
  useEffect(() => {
    if (selectedProject && selectedProject.customer_id) {
      if (
        String(newInvoice.customer_id) !== String(selectedProject.customer_id)
      ) {
        setNewInvoice({
          ...newInvoice,
          customer_id: String(selectedProject.customer_id),
        });
      }
    }
  }, [selectedProject, newInvoice, setNewInvoice]);

  // NEW: Prefill invoice line items and description from the selected project's quotation or details
  useEffect(() => {
    const prefillFromProject = async () => {
      if (!selectedProject) return;

      try {
        // Try to prefill from linked quotation if available
        if (selectedProject.quotation_id) {
          const res = await fetch(
            `/api/quotations/${selectedProject.quotation_id}`,
          );
          if (res.ok) {
            const data = await res.json();
            const q = data?.quotation;
            const qItems = Array.isArray(q?.line_items) ? q.line_items : [];

            // Map quotation line items into invoice line items
            const mapped = qItems.map((it) => ({
              description: it.description || it.material_name || "",
              quantity: parseFloat(it.quantity || 1),
              unit_price: parseFloat(it.unit_price || 0),
            }));

            // Optionally include labor as a separate line if present on quotation
            if (q?.labor_hours && q?.labor_rate) {
              const laborHours = parseFloat(q.labor_hours) || 0;
              const laborRate = parseFloat(q.labor_rate) || 0;
              if (laborHours > 0 && laborRate > 0) {
                mapped.push({
                  description: "Labor",
                  quantity: laborHours,
                  unit_price: laborRate,
                });
              }
            }

            // If we collected items, set them; also set a helpful default note
            if (mapped.length > 0) {
              setNewInvoice((prev) => ({
                ...prev,
                // Keep existing fields (issue_date, terms, tax) as-is
                line_items: mapped,
                // Notes include project and quotation references for clarity
                notes:
                  prev.notes && prev.notes.trim().length > 0
                    ? prev.notes
                    : `${selectedProject.project_number || ""} - ${selectedProject.title || ""}${q?.title ? ` / ${q.title}` : ""}`,
              }));
              return;
            }
          }
        }

        // Fallback: use basic project details if no quotation items
        const fallbackDescription =
          (selectedProject?.description &&
            selectedProject.description.trim()) ||
          `${selectedProject?.project_number || ""} - ${selectedProject?.title || "Project"}`;

        // If the project included a quoted price in list response, use it; otherwise 0
        const unitPrice = parseFloat(selectedProject?.quoted_price || 0) || 0;

        setNewInvoice((prev) => ({
          ...prev,
          line_items: [
            {
              description: fallbackDescription,
              quantity: 1,
              unit_price: unitPrice,
            },
          ],
          notes:
            prev.notes && prev.notes.trim().length > 0
              ? prev.notes
              : fallbackDescription,
        }));
      } catch (err) {
        console.error("Failed to prefill invoice from project:", err);
        // Do not block UI; keep existing line items
      }
    };

    prefillFromProject();
    // We intentionally only run when project changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]);

  // ADD: preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const iframeRef = useRef(null);

  const handlePrintPreview = useCallback(() => {
    const node = iframeRef.current;
    if (node && node.contentWindow) {
      node.contentWindow.focus();
      node.contentWindow.print();
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-neutral-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Create New Invoice
          </h2>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1.5 text-sm rounded-md bg-neutral-800 text-white hover:bg-neutral-900"
          >
            Preview
          </button>
        </div>

        {/* Two-column layout: form left, preview right */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project selection */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Project (Completed only) *
                  </label>
                  <select
                    required
                    value={newInvoice.project_id}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        project_id: e.target.value,
                      })
                    }
                    className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                    style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                  >
                    <option value="">Select a completed project</option>
                    {completedProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_number} - {project.title}
                      </option>
                    ))}
                  </select>
                  {projects?.length > 0 && completedProjects.length === 0 && (
                    <p className="mt-1 text-xs text-neutral-500">
                      No completed projects found. Complete a project report to
                      mark the project as completed.
                    </p>
                  )}
                </div>

                {/* Customer display */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Customer (auto)
                  </label>
                  <input
                    type="text"
                    value={
                      selectedProject?.customer_name || "Pick a project first"
                    }
                    disabled
                    className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-neutral-700 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoice.issue_date}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        issue_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newInvoice.payment_terms}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        payment_terms: e.target.value,
                      })
                    }
                    className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                    style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                  >
                    {paymentTermsOptions.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={newInvoice.currency}
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, currency: e.target.value })
                    }
                    className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                    style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                  >
                    <option value="IDR">Rp (IDR)</option>
                    <option value="SGD">S$ (SGD)</option>
                    <option value="USD">US$ (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newInvoice.tax_rate}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        tax_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900">
                    Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newInvoice.line_items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                    >
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(index, "description", e.target.value)
                          }
                          placeholder="Item description..."
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "unit_price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900">
                          {formatCurrency(
                            item.quantity * item.unit_price,
                            newInvoice.currency,
                          )}
                        </span>
                        {newInvoice.line_items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-neutral-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(
                          calculateTotals(
                            newInvoice.line_items,
                            newInvoice.tax_rate,
                          ).subtotal,
                          newInvoice.currency,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax ({newInvoice.tax_rate}%):</span>
                      <span>
                        {formatCurrency(
                          calculateTotals(
                            newInvoice.line_items,
                            newInvoice.tax_rate,
                          ).taxAmount,
                          newInvoice.currency,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-medium border-t pt-2">
                      <span>Total:</span>
                      <span>
                        {formatCurrency(
                          calculateTotals(
                            newInvoice.line_items,
                            newInvoice.tax_rate,
                          ).total,
                          newInvoice.currency,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Additional notes or terms..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {previewOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col"
              style={{ height: "95vh", width: "min(100%, calc(95vh * 0.707))" }}
            >
              <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Preview Invoice
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
                    title="Export PDF will be available after saving the invoice."
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
                    title="Invoice Print Host"
                    srcDoc="<!DOCTYPE html><html><head><meta charset='utf-8'></head><body></body></html>"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: 0,
                      display: "none",
                    }}
                  />
                  <InvoicePreview
                    invoice={newInvoice}
                    customers={customers}
                    projects={projects}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
