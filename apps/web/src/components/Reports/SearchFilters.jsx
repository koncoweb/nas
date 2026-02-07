import { statusOptions } from "@/utils/reportHelpers";

export function SearchFilters({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  selectedProject,
  projects,
  onSearch,
  onStatusChange,
  onProjectChange,
  onClear,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <form onSubmit={onSearch} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search reports by project, work summary, or customer feedback..."
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
          {(searchTerm || selectedStatus || selectedProject) && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onStatusChange("")}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedStatus === ""
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                All Statuses
              </button>
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => onStatusChange(status.value)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedStatus === status.value
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Filter by Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_number} - {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
