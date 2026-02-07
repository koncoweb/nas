export function SearchFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  categories,
  onSearch,
  onCategoryChange,
  onClear,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <form onSubmit={onSearch} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search materials by name, description, or part number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Search
          </button>
          {(searchTerm || selectedCategory) && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-neutral-700 py-2">
              Filter by category:
            </span>
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedCategory === ""
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedCategory === category
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
