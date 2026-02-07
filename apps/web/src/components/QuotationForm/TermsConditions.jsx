export function TermsConditions({ formData, onInputChange }) {
  // helper to update multiple fields using provided onInputChange (expects event-like objects)
  const setField = (name, value) => onInputChange({ target: { name, value } });

  const handlePlanChange = (e) => {
    const plan = e.target.value;
    // apply presets to payment_percentage and payment_timing
    if (plan === "FULL") {
      setField("payment_percentage", 100);
      setField("payment_timing", "Upon work completion");
    } else if (plan === "DP30_70") {
      setField("payment_percentage", 30);
      setField(
        "payment_timing",
        "30% Down Payment upon PO, 70% upon completion",
      );
    } else if (plan === "DP50_50") {
      setField("payment_percentage", 50);
      setField(
        "payment_timing",
        "50% Down Payment upon PO, 50% upon completion",
      );
    } else if (plan === "CUSTOM_DP") {
      // keep current numbers; user can edit below
      if (!formData.payment_percentage || formData.payment_percentage === 100) {
        setField("payment_percentage", 30);
      }
      if (!formData.payment_timing) {
        setField(
          "payment_timing",
          "<DP>% Down Payment upon PO, balance per agreement",
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Terms & Conditions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Supply Time Estimation
          </label>
          <input
            type="text"
            name="time_estimation_supply"
            value={formData.time_estimation_supply}
            onChange={onInputChange}
            placeholder="e.g., 6-7 Weeks"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Work Time Estimation
          </label>
          <input
            type="text"
            name="time_estimation_work"
            value={formData.time_estimation_work}
            onChange={onInputChange}
            placeholder="e.g., 4-5 Days"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* NEW: Flexible payment presets to accommodate Down Payment */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Payment Plan
          </label>
          <select
            onChange={handlePlanChange}
            className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
            style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
            defaultValue={
              formData.payment_percentage === 100
                ? "FULL"
                : formData.payment_percentage === 30
                  ? "DP30_70"
                  : formData.payment_percentage === 50
                    ? "DP50_50"
                    : "CUSTOM_DP"
            }
          >
            <option value="FULL" style={{ color: '#111827' }}>Full Payment on Completion (100%)</option>
            <option value="DP30_70" style={{ color: '#111827' }}>DP 30% + 70% on Completion</option>
            <option value="DP50_50" style={{ color: '#111827' }}>DP 50% + 50% on Completion</option>
            <option value="CUSTOM_DP" style={{ color: '#111827' }}>Custom Down Payment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Down Payment (%)
          </label>
          <input
            type="number"
            name="payment_percentage"
            value={formData.payment_percentage}
            onChange={onInputChange}
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Set 30, 50, or any number as needed.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Payment Timing / Terms
          </label>
          <input
            type="text"
            name="payment_timing"
            value={formData.payment_timing}
            onChange={onInputChange}
            placeholder="e.g., 30% Down Payment upon PO, 70% upon completion"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Validity (Days)
          </label>
          <input
            type="number"
            name="validity_days"
            value={formData.validity_days}
            onChange={onInputChange}
            min="1"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Valid Until
          </label>
          <input
            type="date"
            name="valid_until"
            value={formData.valid_until}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Other Terms
        </label>
        <textarea
          name="other_terms"
          value={formData.other_terms}
          onChange={onInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={onInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
