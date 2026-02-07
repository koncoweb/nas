import { Plus, X } from "lucide-react";

export default function ScopeGroups({
  groups,
  onAddGroup,
  onRemoveGroup,
  onChangeGroupTitle,
  onAddItem,
  onRemoveItem,
  onChangeItem,
  formData,
}) {
  const currency = (formData?.currency || "IDR").toUpperCase();
  const currencyLabel =
    currency === "USD" ? "US$" : currency === "SGD" ? "S$" : "Rp";

  const fmt = (n) => {
    const val = parseFloat(n || 0);
    if (currency === "USD")
      return `US$ ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (currency === "SGD")
      return `S$ ${val.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `Rp ${Math.round(val).toLocaleString("id-ID")}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Scope of Work (Groups)
        </h2>
        <button
          type="button"
          onClick={onAddGroup}
          className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Group
        </button>
      </div>

      {groups.length === 0 && (
        <div className="text-sm text-neutral-500">
          No scope groups yet. Click "Add Group" to start.
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="border border-neutral-200 rounded-md p-4">
            <div className="flex items-end gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Scope of Work Title
                </label>
                <input
                  type="text"
                  value={group.title}
                  onChange={(e) => onChangeGroupTitle(gIdx, e.target.value)}
                  placeholder="e.g., Main Air Conditioning System"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveGroup(gIdx)}
                className="text-red-600 hover:text-red-700 p-2"
                aria-label="Remove group"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-neutral-700">Items</div>
              <button
                type="button"
                onClick={() => onAddItem(gIdx)}
                className="flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {group.items.map((item, iIdx) => {
                const total =
                  parseFloat(item.quantity || 0) *
                    parseFloat(item.unit_price || 0) || 0;
                return (
                  <div
                    key={iIdx}
                    className="border border-neutral-200 rounded-md p-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            onChangeItem(
                              gIdx,
                              iIdx,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Describe the work/material"
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          min="0"
                          step="0.01"
                          onChange={(e) =>
                            onChangeItem(gIdx, iIdx, "quantity", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit_type}
                          onChange={(e) =>
                            onChangeItem(
                              gIdx,
                              iIdx,
                              "unit_type",
                              e.target.value,
                            )
                          }
                          placeholder="Unit, Lot, Meter, Day"
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Unit Price ({currencyLabel})
                        </label>
                        <input
                          type="number"
                          value={item.unit_price}
                          min="0"
                          step={currency === "IDR" ? "1000" : "0.01"}
                          onChange={(e) =>
                            onChangeItem(
                              gIdx,
                              iIdx,
                              "unit_price",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-neutral-700 font-medium">
                          Total: {fmt(total)}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(gIdx, iIdx)}
                          className="text-red-600 hover:text-red-700 p-2"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
