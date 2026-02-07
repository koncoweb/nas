export function EmptyState({ hasFilters, canManageInvoices, onCreateClick }) {
  return (
    <div className="p-8 text-center">
      <svg
        className="mx-auto h-12 w-12 text-neutral-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        No invoices found
      </h3>
      <p className="text-neutral-600">
        {hasFilters
          ? "No invoices match your search criteria"
          : "Get started by creating your first invoice"}
      </p>
      {canManageInvoices && !hasFilters && (
        <button
          onClick={onCreateClick}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
        >
          Create Invoice
        </button>
      )}
    </div>
  );
}
