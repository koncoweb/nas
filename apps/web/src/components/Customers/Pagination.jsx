export function Pagination({ pagination, currentPage, onPageChange }) {
  if (pagination.pages <= 1) {
    return null;
  }

  return (
    <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
      <div className="text-sm text-neutral-700">
        Showing page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
        total customers)
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
          (page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm border rounded-md ${
                currentPage === page
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-neutral-300 hover:bg-neutral-100"
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pagination.pages}
          className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
