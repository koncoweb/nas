export function MaterialsTable({ materials, canManageMaterials, onEdit }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Material
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Part Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Unit Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Supplier
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Updated
            </th>
            {canManageMaterials && (
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {materials.map((material) => (
            <tr key={material.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {material.name}
                  </div>
                  {material.description && (
                    <div className="text-sm text-neutral-500 truncate max-w-xs">
                      {material.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {material.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {material.category}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {material.part_number || "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {material.unit_cost
                  ? `$${parseFloat(material.unit_cost).toFixed(2)} / ${material.unit_type || "Unit"}`
                  : "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {material.supplier || "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {new Date(material.updated_at).toLocaleDateString()}
              </td>
              {canManageMaterials && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(material)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
