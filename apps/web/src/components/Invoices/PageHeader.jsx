export function InvoicesPageHeader({ canManageInvoices, onCreateClick }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Invoices</h1>
          <p className="mt-2 text-neutral-600">
            Create and manage customer invoices
          </p>
        </div>
        {canManageInvoices && (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Invoice
          </button>
        )}
      </div>
    </div>
  );
}
