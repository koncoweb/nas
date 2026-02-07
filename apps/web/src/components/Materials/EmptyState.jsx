export function EmptyState({
  searchTerm,
  selectedCategory,
  canManageMaterials,
  onAddMaterial,
}) {
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
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        No materials found
      </h3>
      <p className="text-neutral-600">
        {searchTerm || selectedCategory
          ? "No materials match your search criteria"
          : "Get started by adding your first material"}
      </p>
      {canManageMaterials && !searchTerm && !selectedCategory && (
        <button
          onClick={onAddMaterial}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
        >
          Add Material
        </button>
      )}
    </div>
  );
}
