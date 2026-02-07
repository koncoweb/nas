export function MaterialFormModal({
  isOpen,
  isEdit,
  material,
  onMaterialChange,
  onSubmit,
  onClose,
  submitting,
  error,
  unitTypes,
  commonCategories,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEdit ? "Edit Material" : "Add New Material"}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Material Name *
              </label>
              <input
                type="text"
                required
                value={material.name}
                onChange={(e) =>
                  onMaterialChange({ ...material, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter material name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={material.description}
                onChange={(e) =>
                  onMaterialChange({
                    ...material,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter material description"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category
              </label>
              <select
                value={material.category}
                onChange={(e) =>
                  onMaterialChange({
                    ...material,
                    category: e.target.value,
                  })
                }
                className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
              >
                <option value="">Select category</option>
                {commonCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Unit Type
              </label>
              <select
                value={material.unit_type}
                onChange={(e) =>
                  onMaterialChange({
                    ...material,
                    unit_type: e.target.value,
                  })
                }
                className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
              >
                {unitTypes.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={material.unit_cost}
                onChange={(e) =>
                  onMaterialChange({
                    ...material,
                    unit_cost: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Part Number
              </label>
              <input
                type="text"
                value={material.part_number}
                onChange={(e) =>
                  onMaterialChange({
                    ...material,
                    part_number: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter part number"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={material.supplier}
                onChange={(e) =>
                  onMaterialChange({
                    ...material,
                    supplier: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter supplier name"
              />
            </div>
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
              {submitting
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Material"
                  : "Create Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
