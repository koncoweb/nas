"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { useProjects } from "@/hooks/useProjects";

export default function EditReportPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState("sales");
  const { projects } = useProjects(user);
  const reportId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    project_id: "",
    report_type: "work_done",
    completion_date: "",
    work_summary: "",
    materials_used: "",
    recommendations: "",
    customer_feedback: "",
    issues_encountered: "",
    // DO fields
    delivery_number: "",
    delivered_date: "",
    delivery_items: "",
    delivery_notes: "",
    status: "pending",
  });

  // Fetch user profile to get role
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.user_role || "sales");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch report details
  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!reportId) return;
        setLoading(true);
        const response = await fetch(`/api/reports/${reportId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();
        const report = data.report;

        setFormData({
          project_id: report.project_id || "",
          report_type: report.report_type || "work_done",
          completion_date: report.completion_date || "",
          work_summary: report.work_summary || "",
          materials_used: report.materials_used || "",
          recommendations: report.recommendations || "",
          customer_feedback: report.customer_feedback || "",
          issues_encountered: report.issues_encountered || "",
          // DO fields
          delivery_number: report.delivery_number || "",
          delivered_date: report.delivered_date || "",
          delivery_items: report.delivery_items || "",
          delivery_notes: report.delivery_notes || "",
          status: report.status || "pending",
        });
        setError("");
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Failed to load report details");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validation
    const isDO = (formData.report_type || "work_done") === "delivery_order";
    if (isDO) {
      if (!formData.delivered_date) {
        setError("Delivered date is required");
        return;
      }
      if (!formData.delivery_items?.trim()) {
        setError("Delivery items are required");
        return;
      }
    } else {
      if (!formData.work_summary?.trim()) {
        setError("Work summary is required");
        return;
      }
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update report");
      }

      setSuccessMessage("Report updated successfully!");
      setTimeout(() => {
        window.location.href = `/reports/${reportId}`;
      }, 1500);
    } catch (error) {
      console.error("Error updating report:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle field updates
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const isDO = (formData.report_type || "work_done") === "delivery_order";

  // Loading state
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
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
                  {user?.name || user?.email}
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
            <p className="text-neutral-600">Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Please sign in to edit reports</p>
          <a
            href="/account/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Permission check
  const canManageReports = userRole === "leader" || userRole === "engineer";
  if (!canManageReports) {
    return (
      <div className="min-h-screen bg-neutral-50">
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
                  {user?.name || user?.email}
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
              Permission Denied
            </h3>
            <p className="text-red-700 mb-4">
              You don't have permission to edit reports.
            </p>
            <a
              href="/reports"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Reports
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
                {user?.name || user?.email}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  href="/reports"
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  Reports
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
                  href={`/reports/${reportId}`}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  Report #{reportId}
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
                <span className="text-neutral-900 font-medium">Edit</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Edit Report</h2>
          <p className="text-neutral-600">
            Update the project report information below
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => updateField("project_id", e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_number} - {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Report Type
                </label>
                <select
                  value={formData.report_type}
                  onChange={(e) => updateField("report_type", e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                >
                  <option value="work_done">Work Done Report</option>
                  <option value="delivery_order">Delivery Order</option>
                </select>
              </div>

              {formData.report_type !== "delivery_order" && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) =>
                      updateField("completion_date", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {formData.report_type === "delivery_order" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Delivery No
                    </label>
                    <input
                      type="text"
                      value={formData.delivery_number}
                      onChange={(e) =>
                        updateField("delivery_number", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Delivered Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.delivered_date}
                      onChange={(e) =>
                        updateField("delivered_date", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Summary or Delivery Items */}
          {formData.report_type !== "delivery_order" ? (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Work Summary <span className="text-red-500">*</span>
              </h3>
              <textarea
                value={formData.work_summary}
                onChange={(e) => updateField("work_summary", e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the work performed..."
                required
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Delivery Items <span className="text-red-500">*</span>
              </h3>
              <textarea
                value={formData.delivery_items}
                onChange={(e) => updateField("delivery_items", e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="List items and quantities delivered..."
                required
              />
            </div>
          )}

          {/* Materials Used / Recommendations / Feedback / Issues or DO Notes */}
          {formData.report_type !== "delivery_order" ? (
            <>
              {/* Materials Used */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Materials Used
                </h3>
                <textarea
                  value={formData.materials_used}
                  onChange={(e) =>
                    updateField("materials_used", e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List materials used during the project..."
                />
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Recommendations
                </h3>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) =>
                    updateField("recommendations", e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any recommendations for the customer..."
                />
              </div>

              {/* Customer Feedback */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Customer Feedback
                </h3>
                <textarea
                  value={formData.customer_feedback}
                  onChange={(e) =>
                    updateField("customer_feedback", e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Customer comments or feedback..."
                />
              </div>

              {/* Issues Encountered */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Issues Encountered
                </h3>
                <textarea
                  value={formData.issues_encountered}
                  onChange={(e) =>
                    updateField("issues_encountered", e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any issues or challenges encountered..."
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Notes
              </h3>
              <textarea
                value={formData.delivery_notes}
                onChange={(e) => updateField("delivery_notes", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional delivery notes..."
              />
            </div>
          )}

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Status</h3>
            <select
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="customer_signed">Customer Signed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <a
              href={`/reports/${reportId}`}
              className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
