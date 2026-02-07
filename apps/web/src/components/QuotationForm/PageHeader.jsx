import { ArrowLeft } from "lucide-react";

export function PageHeader({
  onBack,
  title = "Create New Quotation",
  subtitle = "Create a detailed professional quotation for HVAC services.",
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-2">
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-700 mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
      </div>
      <p className="text-neutral-600">{subtitle}</p>
    </div>
  );
}
