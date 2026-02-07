import { useState, useEffect } from "react";

export function EditItemModal({
  item,
  index,
  onSave,
  onClose,
  materials = [],
}) {
  const [formData, setFormData] = useState({
    description: "",
    quantity: 1,
    unit_type: "",
    estimated_unit_cost: 0,
    purpose: "",
    is_urgent: false,
    material_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        description: item.description || "",
        quantity: item.quantity || 1,
        unit_type: item.unit_type || "",
        estimated_unit_cost: item.estimated_unit_cost || 0,
        purpose: item.purpose || "",
        is_urgent: item.is_urgent || false,
        material_id: item.material_id || "",
      });
    } else {
      // Reset for new item
      setFormData({
        description: "",
        quantity: 1,
        unit_type: "",
        estimated_unit_cost: 0,
        purpose: "",
        is_urgent: false,
        material_id: "",
      });
    }
  }, [item]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recalculate total if quantity or unit cost changes
      if (field === "quantity" || field === "estimated_unit_cost") {
        updated.estimated_total_cost =
          updated.quantity * updated.estimated_unit_cost;
      }

      return updated;
    });
  };

  const handleMaterialSelect = (materialId) => {
    const selectedMaterial = materials.find(
      (m) => m.id === parseInt(materialId),
    );
    if (selectedMaterial) {
      setFormData((prev) => ({
        ...prev,
        material_id: materialId,
        description: selectedMaterial.name,
        unit_type: selectedMaterial.unit_type,
        estimated_unit_cost: selectedMaterial.unit_cost,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate total cost
      const totalCost = formData.quantity * formData.estimated_unit_cost;
      const itemData = {
        ...formData,
        estimated_total_cost: totalCost,
      };

      await onSave(itemData, index);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item && index !== -1) return null; // Don't show for invalid states

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            {index === -1 ? "Add New Item" : "Edit Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Material Selection */}
          {materials.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Material (Optional)
              </label>
              <select
                value={formData.material_id}
                onChange={(e) => handleMaterialSelect(e.target.value)}
                className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
              >
                <option value="">-- Select Material --</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              rows="3"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe the item needed..."
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  handleInputChange("quantity", parseFloat(e.target.value) || 0)
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Unit Type
              </label>
              <input
                type="text"
                value={formData.unit_type}
                onChange={(e) => handleInputChange("unit_type", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="pcs, kg, m, etc."
              />
            </div>
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Estimated Unit Cost
            </label>
            <input
              type="number"
              value={formData.estimated_unit_cost}
              onChange={(e) =>
                handleInputChange(
                  "estimated_unit_cost",
                  parseFloat(e.target.value) || 0,
                )
              }
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>

          {/* Total Cost Display */}
          <div className="bg-neutral-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-700">
                Total Cost:
              </span>
              <span className="text-lg font-bold text-primary-600">
                IDR{" "}
                {(
                  formData.quantity * formData.estimated_unit_cost
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Why is this item needed?"
            />
          </div>

          {/* Urgent Flag */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_urgent"
              checked={formData.is_urgent}
              onChange={(e) => handleInputChange("is_urgent", e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label
              htmlFor="is_urgent"
              className="ml-2 text-sm font-medium text-neutral-700"
            >
              Mark as urgent
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : index === -1
                  ? "Add Item"
                  : "Update Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
