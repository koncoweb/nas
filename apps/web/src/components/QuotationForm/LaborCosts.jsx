export function LaborCosts({ formData, onInputChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Labor Costs</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Labor Hours
          </label>
          <input
            type="number"
            name="labor_hours"
            value={formData.labor_hours}
            onChange={onInputChange}
            min="0"
            step="0.5"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Hourly Rate (Rp)
          </label>
          <input
            type="number"
            name="labor_rate"
            value={formData.labor_rate}
            onChange={onInputChange}
            min="0"
            step="1000"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Profit Margin (%)
        </label>
        <input
          type="number"
          name="profit_margin"
          value={formData.profit_margin}
          onChange={onInputChange}
          min="0"
          max="100"
          step="0.1"
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 md:w-48"
        />
      </div>
    </div>
  );
}
