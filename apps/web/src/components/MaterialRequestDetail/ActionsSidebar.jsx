import { formatCurrency } from "@/utils/materialRequestFormatters";

export function ActionsSidebar({
  userRole,
  materialRequest,
  requestId,
  actionLoading,
  handleAction,
}) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 sticky top-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Actions</h3>

        <div className="space-y-3">
          {/* Engineer actions */}
          {userRole === "engineer" && materialRequest.status === "draft" && (
            <>
              <button
                onClick={() => handleAction("submit")}
                disabled={actionLoading}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Submitting..." : "Submit for Approval"}
              </button>
              <a
                href={`/material-requests/${requestId}/edit`}
                className="block w-full text-center bg-white text-neutral-700 px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors font-medium"
              >
                Edit Request
              </a>
            </>
          )}

          {/* Sales actions */}
          {userRole === "sales" && materialRequest.status === "submitted" && (
            <>
              <button
                onClick={() => {
                  const comments = prompt("Comments for approval (optional):");
                  handleAction("review", comments, true); // approve = true
                }}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Approving..." : "Review & Approve"}
              </button>
              <button
                onClick={() => {
                  const comments = prompt(
                    "Please provide a reason for rejection:",
                  );
                  if (comments) handleAction("review", comments, false); // approve = false
                }}
                disabled={actionLoading}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Request
              </button>
            </>
          )}

          {/* Leader actions */}
          {userRole === "leader" &&
            materialRequest.status === "under_review" && (
              <>
                <button
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Approving..." : "Approve Request"}
                </button>
                <button
                  onClick={() => {
                    const comments = prompt(
                      "Please provide a reason for rejection:",
                    );
                    if (comments) handleAction("reject", comments);
                  }}
                  disabled={actionLoading}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Request
                </button>
              </>
            )}

          {/* Direct Approve Button for Sales and Leader */}
          {(userRole === "sales" || userRole === "leader") &&
            (materialRequest.status === "draft" ||
              materialRequest.status === "submitted" ||
              materialRequest.status === "under_review") && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to approve this request directly? This will bypass the normal approval workflow.",
                    )
                  ) {
                    handleAction("direct_approve");
                  }
                }}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {actionLoading ? (
                  "Approving..."
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Direct Approve
                  </>
                )}
              </button>
            )}

          {/* Cancel action for draft requests */}
          {(userRole === "engineer" || userRole === "leader") &&
            materialRequest.status === "draft" && (
              <button
                onClick={() => {
                  if (
                    confirm("Are you sure you want to cancel this request?")
                  ) {
                    handleAction("cancel");
                  }
                }}
                disabled={actionLoading}
                className="w-full bg-neutral-600 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Request
              </button>
            )}

          <a
            href="/material-requests"
            className="block w-full text-center bg-white text-neutral-700 px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors font-medium"
          >
            Back to List
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="text-sm font-medium text-neutral-900 mb-3">Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Items:</span>
              <span className="font-medium text-neutral-900">
                {materialRequest.items ? materialRequest.items.length : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Status:</span>
              <span className="font-medium text-neutral-900 capitalize">
                {materialRequest.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200">
              <span className="text-neutral-900 font-medium">Total Cost:</span>
              <span className="font-bold text-primary-600">
                {formatCurrency(materialRequest.estimated_total_cost)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
