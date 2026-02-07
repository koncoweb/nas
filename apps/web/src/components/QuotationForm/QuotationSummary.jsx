import { Save } from "lucide-react";

export function QuotationSummary({
  calculations,
  formData,
  loading,
  onCancel,
  submitButtonText = "Create Quotation",
}) {
  // NEW: currency-aware formatter (Rp, S$, US$)
  const fmt = (amount, currency) => {
    const n = parseFloat(amount || 0);
    if (currency === "USD") {
      return `US$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === "SGD") {
      return `S$ ${n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // default IDR
    return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  };

  const currency = formData?.currency || "IDR";

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Quotation Summary
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-neutral-600">Materials Total:</span>
          <span className="text-sm font-medium">
            {fmt(calculations.materialsTotal, currency)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-neutral-600">Labor Cost:</span>
          <span className="text-sm font-medium">
            {fmt(calculations.laborCost, currency)}
          </span>
        </div>

        <hr />

        <div className="flex justify-between">
          <span className="text-sm text-neutral-600">Subtotal:</span>
          <span className="text-sm font-medium">
            {fmt(calculations.subtotal, currency)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-neutral-600">
            Profit ({formData.profit_margin}%)
          </span>
          <span className="text-sm font-medium">
            {fmt(calculations.profit, currency)}
          </span>
        </div>

        <hr />

        <div className="flex justify-between">
          <span className="font-medium">Total:</span>
          <span className="font-bold text-lg text-primary-600">
            {fmt(calculations.total, currency)}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {submitButtonText}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>

      {/* Helpful Tips */}
      <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-md">
        <h3 className="text-sm font-medium text-primary-900 mb-2">💡 Tips</h3>
        <ul className="text-xs text-primary-700 space-y-1">
          <li>• Select materials to auto-fill pricing</li>
          <li>• Add detailed scope of work for clarity</li>
          <li>• Quotations start in draft status</li>
          <li>• Set appropriate validity period</li>
        </ul>
      </div>
    </div>
  );
}
