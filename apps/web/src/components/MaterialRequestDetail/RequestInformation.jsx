import {
  formatDate,
  getUrgencyColor,
  getStatusColor,
  getStatusText,
} from "@/utils/materialRequestFormatters";

export function RequestInformation({ materialRequest }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Request Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Project
          </label>
          <p className="text-neutral-900">
            {materialRequest.project_number} - {materialRequest.project_title}
          </p>
          <p className="text-sm text-neutral-600">
            {materialRequest.customer_name}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Request Type
          </label>
          <p className="text-neutral-900 capitalize">
            {materialRequest.request_type === "material"
              ? "Material"
              : "Operational Cost"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Requested By
          </label>
          <p className="text-neutral-900">{materialRequest.requested_by_name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Status
          </label>
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(materialRequest.status)}`}
          >
            {getStatusText(materialRequest.status)}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Request Date
          </label>
          <p className="text-neutral-900">
            {formatDate(materialRequest.request_date)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Needed By
          </label>
          <p className="text-neutral-900">
            {materialRequest.needed_date
              ? formatDate(materialRequest.needed_date)
              : "Not specified"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Urgency
          </label>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getUrgencyColor(materialRequest.urgency)}`}
          >
            {materialRequest.urgency.toUpperCase()}
          </span>
        </div>
      </div>

      {materialRequest.description && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <label className="block text-sm font-medium text-neutral-500 mb-1">
            Description
          </label>
          <p className="text-neutral-900">{materialRequest.description}</p>
        </div>
      )}
    </div>
  );
}
