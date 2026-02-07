import { formatCurrency } from "@/utils/materialRequestFormatters";

export function ItemsTable({
  materialRequest,
  userRole,
  requestId,
  onEditItem,
  onDeleteItem,
}) {
  const canEditItems =
    (userRole === "engineer" && materialRequest.status === "draft") ||
    (userRole === "sales" && materialRequest.status === "submitted") ||
    (userRole === "leader" &&
      (materialRequest.status === "under_review" ||
        materialRequest.status === "draft"));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Requested Items
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total
              </th>
              {canEditItems && (
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {materialRequest.items && materialRequest.items.length > 0 ? (
              materialRequest.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-4 py-3">
                    <div className="text-sm text-neutral-900">
                      {item.description}
                    </div>
                    {item.purpose && (
                      <div className="text-xs text-neutral-500 mt-1">
                        Purpose: {item.purpose}
                      </div>
                    )}
                    {item.is_urgent && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        URGENT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900">
                    {item.quantity} {item.unit_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900">
                    {formatCurrency(item.estimated_unit_cost)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                    {formatCurrency(item.estimated_total_cost)}
                  </td>
                  {canEditItems && (
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditItem(item, index)}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteItem(item, index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={canEditItems ? "5" : "4"}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  No items found
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-neutral-50">
            <tr>
              <td
                colSpan={canEditItems ? "4" : "3"}
                className="px-4 py-3 text-right text-sm font-medium text-neutral-900"
              >
                Total Estimated Cost:
              </td>
              <td className="px-4 py-3 text-sm font-bold text-primary-600">
                {formatCurrency(materialRequest.estimated_total_cost)}
              </td>
              {canEditItems && <td className="px-4 py-3"></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {canEditItems && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onEditItem(null, -1)} // null item, -1 index for adding new
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Add New Item
          </button>
        </div>
      )}
    </div>
  );
}
