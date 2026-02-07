import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch user profile with role
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;

        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch quotations
  const fetchQuotations = async (
    page = 1,
    searchTerm = search,
    statusFilter = status,
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/quotations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch quotations");

      const data = await response.json();
      setQuotations(data.quotations);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setError("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchQuotations();
    }
  }, [userProfile]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchQuotations(1, search, status);
  };

  const handleStatusFilter = (newStatus) => {
    setStatus(newStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchQuotations(1, search, newStatus);
  };

  const handlePageChange = (newPage) => {
    fetchQuotations(newPage, search, status);
  };

  const handleStatusUpdate = async (quotationId, newStatus) => {
    try {
      // If approving, show confirmation
      if (newStatus === "approved") {
        const quotation = quotations.find((q) => q.id === quotationId);
        if (
          !confirm(
            `Are you sure you want to approve quotation ${quotation?.quote_number} and convert it to a project?`,
          )
        ) {
          return;
        }

        // First update status to approved
        const statusResponse = await fetch(`/api/quotations/${quotationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!statusResponse.ok) throw new Error("Failed to update status");

        // Then convert to project
        const projectResponse = await fetch(
          `/api/quotations/${quotationId}/convert-to-project`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!projectResponse.ok)
          throw new Error("Failed to convert to project");

        const projectData = await projectResponse.json();

        // Show success message with project number
        alert(
          `Quotation ${quotation?.quote_number} has been approved and converted to Project ${projectData.project.project_number}!`,
        );
      } else {
        // For other status updates, just update the status
        const response = await fetch(`/api/quotations/${quotationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) throw new Error("Failed to update status");
      }

      // Refresh the list
      fetchQuotations(pagination.page, search, status);
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update quotation status");
    }
  };

  const getStatusBadge = (quotationStatus) => {
    const styles = {
      draft: "bg-neutral-100 text-neutral-700",
      sent: "bg-primary-100 text-primary-700",
      approved: "bg-accent-100 text-accent-700",
      rejected: "bg-red-100 text-red-700",
      expired: "bg-accent-100 text-accent-700",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[quotationStatus] || styles.draft}`}
      >
        {quotationStatus?.charAt(0).toUpperCase() + quotationStatus?.slice(1) ||
          "Draft"}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  if (userLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = userProfile?.user_role || "sales";
  const canCreateQuotations = userRole === "leader" || userRole === "sales";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-neutral-900">
                  HVAC Manager
                </h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                {userProfile?.name || userProfile?.email}
              </span>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                {userRole}
              </span>
              <a
                href="/account/logout"
                className="text-neutral-500 hover:text-neutral-700 text-sm font-medium"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Quotations</h2>
          <p className="text-neutral-600">
            Manage project quotations and proposals.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search quotations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Search
                </button>
              </form>

              <select
                value={status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-neutral-900 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* New Quotation Button */}
            {canCreateQuotations && (
              <a
                href="/quotations/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                New Quotation
              </a>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Quotations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading quotations...</p>
            </div>
          ) : quotations.length === 0 ? (
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
              <p className="text-neutral-600 mb-2">No quotations found</p>
              {canCreateQuotations && (
                <a
                  href="/quotations/new"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create your first quotation
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Quote #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Service Type
                      </th>
                      {userRole !== "engineer" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Final Price
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Valid Until
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {quotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {quotation.quote_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {quotation.customer_name || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-900">
                          <div
                            className="max-w-xs truncate"
                            title={quotation.title}
                          >
                            {quotation.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                          {quotation.service_type || "-"}
                        </td>
                        {userRole !== "engineer" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {formatCurrency(quotation.final_price)}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(quotation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                          {formatDate(quotation.valid_until)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <a
                              href={`/quotations/${quotation.id}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              View
                            </a>
                            {canCreateQuotations && (
                              <>
                                <a
                                  href={`/quotations/${quotation.id}/edit`}
                                  className="text-accent-600 hover:text-accent-700"
                                >
                                  Edit
                                </a>
                                {quotation.status === "draft" && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(
                                        quotation.id,
                                        "approved",
                                      )
                                    }
                                    className="text-accent-600 hover:text-accent-700 font-medium"
                                  >
                                    Approve
                                  </button>
                                )}
                                {quotation.project_number && (
                                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                                    Project: {quotation.project_number}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-neutral-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-neutral-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{" "}
                      of {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(5, pagination.pages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                pagination.page === pageNum
                                  ? "bg-primary-600 text-white"
                                  : "text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
