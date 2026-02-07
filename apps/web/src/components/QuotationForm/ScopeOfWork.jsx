import { Plus, X } from "lucide-react";

export function ScopeOfWork({
  scopeWork,
  onScopeWorkChange,
  onAddScopeWork,
  onRemoveScopeWork,
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Scope of Work</h2>
        <button
          type="button"
          onClick={onAddScopeWork}
          className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </button>
      </div>

      <div className="space-y-3">
        {scopeWork.map((work, index) => (
          <div key={index} className="border border-neutral-200 rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Task Description
                </label>
                <textarea
                  value={work.description}
                  onChange={(e) =>
                    onScopeWorkChange(index, "description", e.target.value)
                  }
                  rows={2}
                  placeholder="Describe the work task..."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={work.work_category}
                  onChange={(e) =>
                    onScopeWorkChange(index, "work_category", e.target.value)
                  }
                  placeholder="e.g., Installation, Maintenance"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-between items-end">
                <div className="flex-1 mr-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    value={work.estimated_hours}
                    onChange={(e) =>
                      onScopeWorkChange(
                        index,
                        "estimated_hours",
                        e.target.value,
                      )
                    }
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {scopeWork.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveScopeWork(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
