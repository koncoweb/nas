export function SearchFilters({
  searchTerm,
  onSearchChange,
  onSearch,
  onClear,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <form onSubmit={onSearch} className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers by name, email, phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}
