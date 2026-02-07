import { Printer, Download, Edit, Eye } from "lucide-react";

export function ActionButtons({
  quotationId,
  quotation,
  canEdit,
  onPreview,
  onPrint,
  onExportPDF,
}) {
  if (!canEdit) return null;

  const isAlreadyProject = quotation?.project_id;

  return (
    <div className="mb-6 flex space-x-3 print:hidden">
      <a
        href={`/quotations/${quotationId}/edit`}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Edit className="w-5 h-5 mr-2" />
        Edit Quotation
      </a>

      {isAlreadyProject && (
        <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-lg">
          <span className="font-medium">
            Converted to Project: {quotation?.project_number}
          </span>
        </div>
      )}

      <button
        onClick={onPreview}
        className="inline-flex items-center px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <Eye className="w-5 h-5 mr-2" />
        Preview
      </button>

      <button
        onClick={onPrint}
        className="inline-flex items-center px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <Printer className="w-5 h-5 mr-2" />
        Print
      </button>
      <button
        onClick={onExportPDF}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Download className="w-5 h-5 mr-2" />
        Export PDF
      </button>
    </div>
  );
}
