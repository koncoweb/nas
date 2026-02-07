export default function Exclusions({ formData, setFormData }) {
  const options = [
    "Mobilization / Demobilization",
    "Accommodation & Meal",
    "Power Supply / Utilities",
    "Scaffolding / Lifting Equipment",
    "Painting / Insulation / Civil Works",
    "Customs / Taxes / Duties",
    "Permits & Port Clearance",
    "Waste Disposal",
    "Safety Officer / Safety Equipment",
    "Standby Time / Waiting Charges",
  ];

  const selected = Array.isArray(formData.exclusions)
    ? formData.exclusions
    : [];

  const toggle = (item) => {
    const exists = selected.includes(item);
    const next = exists
      ? selected.filter((x) => x !== item)
      : [...selected, item];
    setFormData((prev) => ({ ...prev, exclusions: next }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-3">Exclusions</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Tick what does not belong to this offer. Add anything else in the box
        below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <label key={opt} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span className="text-neutral-800">{opt}</span>
          </label>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Other exclusions (optional)
        </label>
        <textarea
          rows={3}
          value={formData.exclusions_other || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              exclusions_other: e.target.value,
            }))
          }
          placeholder="Write any other exclusions here..."
          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
