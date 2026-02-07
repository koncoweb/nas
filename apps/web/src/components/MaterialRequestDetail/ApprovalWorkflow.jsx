import { formatDate } from "@/utils/materialRequestFormatters";

export function ApprovalWorkflow({ approvalWorkflow }) {
  if (!approvalWorkflow || approvalWorkflow.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Approval Workflow
      </h3>
      <div className="space-y-4">
        {approvalWorkflow.map((step, index) => (
          <div
            key={index}
            className="flex items-start border-l-4 pl-4"
            style={{
              borderColor:
                step.status === "approved"
                  ? "#10b981"
                  : step.status === "rejected"
                    ? "#ef4444"
                    : step.status === "pending"
                      ? "#f59e0b"
                      : "#9ca3af",
            }}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Step {step.step_order}: {step.approver_role.toUpperCase()}
                  </p>
                  {step.approver_name && (
                    <p className="text-sm text-neutral-600">
                      {step.approver_name}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    step.status === "approved"
                      ? "bg-accent-100 text-accent-800"
                      : step.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : step.status === "pending"
                          ? "bg-accent-100 text-yellow-800"
                          : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {step.status.toUpperCase()}
                </span>
              </div>
              {step.comments && (
                <p className="text-sm text-neutral-600 mt-2">
                  Comments: {step.comments}
                </p>
              )}
              {step.approved_at && (
                <p className="text-xs text-neutral-500 mt-1">
                  {formatDate(step.approved_at)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
