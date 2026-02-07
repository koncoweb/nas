import { ArrowLeft } from "lucide-react";

export function PageHeader({ quotation, getStatusBadge }) {
  return (
    <div className="mb-6 print:hidden">
      <div className="flex items-center mb-2">
        <a
          href="/quotations"
          className="text-primary-600 hover:text-primary-700 mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h2 className="text-2xl font-bold text-neutral-900">Quotation Details</h2>
        {getStatusBadge(quotation.status)}
      </div>
      <p className="text-neutral-600">View and manage quotation information.</p>
    </div>
  );
}
