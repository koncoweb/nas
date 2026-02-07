import { Plus, X } from "lucide-react";

export function MaterialsServices({
  lineItems,
  materials,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  // NEW: pass formData for currency + scope note, and onInputChange to update it
  formData,
  onInputChange,
}) {
  // currency-aware labels and formatter
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Items (Page 2)</h2>
        <button
          type="button"
          onClick={onAddLineItem}
          className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </button>
      </div>

      <div className="space-y-3">
        {lineItems.map((item, index) => (
          <div key={index} className="border border-neutral-200 rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Material (Optional)
                </label>
                <select
                  value={item.material_id || ""}
                  onChange={(e) =>
                    onLineItemChange(index, "material_id", e.target.value)
                  }
                  className="dropdown-fix w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                  style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    onLineItemChange(index, "description", e.target.value)
                  }
                  placeholder="Item description"
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
                  onChange={(e) =>
                    onLineItemChange(index, "quantity", e.target.value)
                  }
                  min="0"
                  step="0.01"
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
                  onChange={(e) =>
                    onLineItemChange(index, "unit_price", e.target.value)
                  }
                  min="0"
                  step={currency === "IDR" ? "1000" : "0.01"}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end">
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveLineItem(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Unit Type
                </label>
                <input
                  type="text"
                  value={item.unit_type}
                  onChange={(e) =>
                    onLineItemChange(index, "unit_type", e.target.value)
                  }
                  placeholder="Unit, Piece, Lot, etc."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Type
                </label>
                <select
                  value={item.item_type}
                  onChange={(e) =>
                    onLineItemChange(index, "item_type", e.target.value)
                  }
                  className="dropdown-fix w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                  style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                >
                  <option value="material">Material</option>
                  <option value="service">Service</option>
                  <option value="consumable">Consumable</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-2 text-right">
              <span className="text-sm font-medium text-neutral-700">
                Total:{" "}
                {fmt(
                  parseFloat(item.quantity || 0) *
                    parseFloat(item.unit_price || 0),
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* NOTE under items for scope remarks */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Notes (related to scope)
        </label>
        <textarea
          name="scope_note"
          value={formData?.scope_note || ""}
          onChange={onInputChange}
          rows={3}
          placeholder="Add any notes related to the scope of work (optional)"
          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
