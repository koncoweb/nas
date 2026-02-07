import { getStatusColor } from "@/utils/materialRequestFormatters";

export function PageHeader({ materialRequest, requestId }) {
  return (
    <div className="mb-8">
      <a
        href="/material-requests"
        className="flex items-center text-neutral-600 hover:text-neutral-900 mb-4"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Material Requests
      </a>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            {materialRequest.title}
          </h2>
          <p className="text-neutral-600 mt-1">Request #{requestId}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(materialRequest.status)}`}
        >
          {materialRequest.status.replace("_", " ").toUpperCase()}
        </span>
      </div>
    </div>
  );
}
