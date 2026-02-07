import { statusOptions, reportTypeOptions } from "@/utils/reportHelpers";

export function EditReportModal({
  show,
  onClose,
  formData,
  updateField,
  error,
  submitting,
  onSubmit,
}) {
  if (!show) return null;

  const isDO = (formData?.report_type || "work_done") === "delivery_order";

  return (
    <div className="fixed inset-0 bg-neutral-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Edit Report</h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {!isDO && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Work Summary *
                </label>
                <textarea
                  required
                  value={formData.work_summary}
                  onChange={(e) => updateField("work_summary", e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the work completed..."
                  rows={4}
                />
              </div>
            )}

            {isDO && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Delivery Items *
                  </label>
                  <textarea
                    required
                    value={formData.delivery_items || ""}
                    onChange={(e) =>
                      updateField("delivery_items", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="List items and quantities delivered..."
                    rows={4}
                  />
                </div>
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
              </>
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
              {submitting ? "Updating..." : "Update Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
