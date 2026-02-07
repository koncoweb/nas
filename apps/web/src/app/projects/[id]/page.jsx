import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

function MainComponent({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const projectId = params.id;

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

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update project status");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      planning: "bg-neutral-100 text-neutral-700",
      in_progress: "bg-primary-100 text-primary-700",
      on_hold: "bg-accent-100 text-accent-700",
      completed: "bg-accent-100 text-accent-700",
      cancelled: "bg-red-100 text-red-700",
    };

    const labels = {
      planning: "Planning",
      in_progress: "In Progress",
      on_hold: "On Hold",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.planning}`}
      >
        {labels[status] || "Planning"}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: "bg-neutral-100 text-neutral-700",
      medium: "bg-primary-100 text-primary-700",
      high: "bg-accent-100 text-accent-700",
      urgent: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.medium}`}
      >
        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || "Medium"}
      </span>
    );
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
  const canEdit = userRole === "leader" || userRole === "sales";

  if (loading) {
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Project Not Found
            </h3>
            <p className="text-red-700 mb-4">
              {error || "The project you're looking for doesn't exist."}
            </p>
            <a
              href="/projects"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Projects
            </a>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <a href="/" className="text-neutral-500 hover:text-neutral-700">
                  Home
                </a>
              </li>
              <li>
                <svg
                  className="w-5 h-5 text-neutral-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <a
                  href="/projects"
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  Projects
                </a>
              </li>
              <li>
                <svg
                  className="w-5 h-5 text-neutral-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <span className="text-neutral-900 font-medium">
                  {project.project_number}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                {project.title}
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-neutral-600">
                  Project #{project.project_number}
                </span>
                {getStatusBadge(project.status)}
                {getPriorityBadge(project.priority)}
              </div>
            </div>
            <div className="flex space-x-3">
              <a
                href="/projects"
                className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Back to Projects
              </a>
              {canEdit && (
                <a
                  href={`/projects/${projectId}/edit`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Edit Project
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Project Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Customer
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {project.customer_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Assigned Engineer
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {project.engineer_name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Start Date
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {formatDate(project.start_date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Expected Completion
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {formatDate(project.expected_completion)}
                  </p>
                </div>
                {project.actual_completion && (
                  <div>
                    <label className="text-sm font-medium text-neutral-500">
                      Actual Completion
                    </label>
                    <p className="text-neutral-900 mt-1">
                      {formatDate(project.actual_completion)}
                    </p>
                  </div>
                )}
                {project.quotation_number && (
                  <div>
                    <label className="text-sm font-medium text-neutral-500">
                      Related Quotation
                    </label>
                    <p className="text-neutral-900 mt-1">
                      <a
                        href={`/quotations/${project.quotation_id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {project.quotation_number}
                      </a>
                    </p>
                  </div>
                )}
              </div>
              {project.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-neutral-500">
                    Description
                  </label>
                  <p className="text-neutral-900 mt-1 whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Status Update Card */}
            {canEdit && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Update Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusUpdate("planning")}
                    disabled={project.status === "planning"}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Planning
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={project.status === "in_progress"}
                    className="px-4 py-2 border border-primary-300 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("on_hold")}
                    disabled={project.status === "on_hold"}
                    className="px-4 py-2 border border-yellow-300 rounded-lg text-accent-700 hover:bg-accent-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    On Hold
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={project.status === "completed"}
                    className="px-4 py-2 border border-accent-300 rounded-lg text-accent-700 hover:bg-accent-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={project.status === "cancelled"}
                    className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {/* Create Material Request Button */}
                <a
                  href={`/material-requests/new?project=${projectId}`}
                  className="block w-full px-4 py-2 text-left bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <div className="flex items-center">
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create Material Request
                  </div>
                </a>
                <a
                  href={`/material-requests?project=${projectId}`}
                  className="block w-full px-4 py-2 text-left border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-neutral-500"
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
                    View Material Requests
                  </div>
                </a>
                <a
                  href={`/costs?project=${projectId}`}
                  className="block w-full px-4 py-2 text-left border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Project Costs
                  </div>
                </a>
                <a
                  href={`/reports?project=${projectId}`}
                  className="block w-full px-4 py-2 text-left border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-neutral-500"
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
                    Project Reports
                  </div>
                </a>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">
                      Project Created
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
                {project.start_date && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-900">
                        Started
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(project.start_date)}
                      </p>
                    </div>
                  </div>
                )}
                {project.expected_completion && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-900">
                        Expected Completion
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(project.expected_completion)}
                      </p>
                    </div>
                  </div>
                )}
                {project.actual_completion && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-900">
                        Completed
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(project.actual_completion)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
