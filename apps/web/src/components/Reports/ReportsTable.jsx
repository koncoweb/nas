import { getStatusBadge, formatDate } from "@/utils/reportHelpers";

export function ReportsTable({ reports, canManageReports, onEditClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Work Summary
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Completion Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Created By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {report.project_number}
                  </div>
                  <div className="text-sm text-neutral-500 truncate max-w-xs">
                    {report.project_title}
                  </div>
                  {report.customer_name && (
                    <div className="text-xs text-neutral-400">
                      {report.customer_name}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-neutral-900 max-w-xs truncate">
                  {report.work_summary}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(report.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {formatDate(report.completion_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {report.created_by_name || "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {formatDate(report.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <a
                    href={`/reports/${report.id}`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    View
                  </a>
                  {canManageReports && (
                    <button
                      onClick={() => onEditClick(report)}
                      className="text-primary-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
