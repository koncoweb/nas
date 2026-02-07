"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

function MaterialRequestsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
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

  // Fetch material requests
  useEffect(() => {
    const fetchMaterialRequests = async () => {
      try {
        if (!userProfile) return;

        setLoading(true);
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter && { status: statusFilter }),
        });

        const response = await fetch(`/api/material-requests?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMaterialRequests(data.material_requests);
          setPagination(data.pagination);
        } else {
          console.error("Failed to fetch material requests");
        }
      } catch (error) {
        console.error("Error fetching material requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialRequests();
  }, [userProfile, pagination.page, searchTerm, statusFilter]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "bg-neutral-100 text-neutral-800";
      case "submitted":
        return "bg-primary-100 text-primary-800";
      case "under_review":
        return "bg-accent-100 text-yellow-800";
      case "approved":
        return "bg-accent-100 text-accent-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-neutral-100 text-neutral-600";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "low":
        return "bg-accent-50 text-accent-700";
      case "medium":
        return "bg-accent-50 text-accent-700";
      case "high":
        return "bg-accent-50 text-accent-700";
      case "urgent":
        return "bg-red-50 text-red-700";
      default:
        return "bg-neutral-50 text-neutral-700";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const userRole = userProfile?.user_role || "engineer";

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
              <span className="text-neutral-400 mx-2">/</span>
              <span className="text-neutral-600">Material Requests</span>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Material Requests
            </h2>
            <p className="text-neutral-600 mt-1">
              {userRole === "engineer"
                ? "Manage your material and operational cost requests"
                : userRole === "sales"
                  ? "Review and forward material requests for approval"
                  : userRole === "leader"
                    ? "Create, review, and approve material requests"
                    : "Track approved material requests and costs"}
            </p>
          </div>
          {(userRole === "engineer" || userRole === "leader") && (
            <a
              href="/material-requests/new"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              New Request
            </a>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search by title, project, or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="dropdown-fix px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Material Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading material requests...</p>
            </div>
          ) : materialRequests.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-12 h-12 text-neutral-400 mx-auto mb-4"
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
              <p className="text-neutral-600">No material requests found</p>
              {(userRole === "engineer" || userRole === "leader") && (
                <a
                  href="/material-requests/new"
                  className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create First Request
                </a>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Request Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Estimated Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {materialRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {request.title}
                          </div>
                          {request.description && (
                            <div className="text-sm text-neutral-600 mt-1">
                              {request.description.length > 60
                                ? `${request.description.substring(0, 60)}...`
                                : request.description}
                            </div>
                          )}
                          <div className="text-xs text-neutral-500 mt-1">
                            Type:{" "}
                            {request.request_type === "material"
                              ? "Material"
                              : "Operational Cost"}
                            {userRole !== "engineer" && (
                              <span> • By: {request.requested_by_name}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-900">
                          {request.project_number}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {request.project_title}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {request.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {formatCurrency(request.estimated_total_cost)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}
                        >
                          {request.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}
                        >
                          {request.urgency.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {formatDate(request.request_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <a
                          href={`/material-requests/${request.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          View
                        </a>
                        {userRole === "engineer" &&
                          request.status === "draft" && (
                            <a
                              href={`/material-requests/${request.id}/edit`}
                              className="text-accent-600 hover:text-green-900"
                            >
                              Edit
                            </a>
                          )}
                        {userRole === "sales" &&
                          request.status === "submitted" && (
                            <a
                              href={`/material-requests/${request.id}/review`}
                              className="text-accent-600 hover:text-yellow-900"
                            >
                              Review
                            </a>
                          )}
                        {userRole === "leader" &&
                          request.status === "under_review" && (
                            <a
                              href={`/material-requests/${request.id}/approve`}
                              className="text-primary-600 hover:text-purple-900"
                            >
                              Approve
                            </a>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialRequestsPage;
