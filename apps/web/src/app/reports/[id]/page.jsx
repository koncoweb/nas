"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

export default function ReportDetailPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState("sales");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const reportId = params.id;

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
        setReport(data.report);
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

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...report,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update report status");
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/reports/${reportId}/approve`, {
        method: "POST",
      });
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.error || "Failed to approve");
      }
      const data = await response.json();
      setReport(data.report);
    } catch (e) {
      console.error("Approve failed", e);
      setError(e.message || "Approval failed");
    } finally {
      setUpdating(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-accent-100 text-yellow-800",
      customer_signed: "bg-primary-100 text-primary-800",
      completed: "bg-accent-100 text-accent-800",
    };

    const labels = {
      pending: "Pending",
      customer_signed: "Customer Signed",
      completed: "Completed",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}
      >
        {labels[status] || "Pending"}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const computeDocNo = (r) => {
    if (!r) return "—";
    if (r.delivery_number) return r.delivery_number;
    const isDO = (r.report_type || "work_done") === "delivery_order";
    const prefix = isDO ? "DO" : "WDR";
    const baseDate = new Date(
      (isDO ? r.delivered_date : r.completion_date) || new Date().toISOString(),
    );
    const ym = `${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, "0")}`;
    const ref = (r.quote_number || r.project_number || "").toString();
    const normalized = ref
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `${prefix}-${ym}-${normalized}`;
  };

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
          <p className="text-neutral-600 mb-4">Please sign in to view reports</p>
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

  // Error state
  if (error || !report) {
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
              Report Not Found
            </h3>
            <p className="text-red-700 mb-4">
              {error || "The report you're looking for doesn't exist."}
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

  const canManageReports = userRole === "leader" || userRole === "engineer";

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
                <span className="text-neutral-900 font-medium">
                  Report #{reportId}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Project Report
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-neutral-600">
                  {report.project_number} - {report.project_title}
                </span>
                {getStatusBadge(report.status)}
              </div>
            </div>
            <div className="flex space-x-3">
              <a
                href={`/api/reports/${reportId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                View PDF
              </a>
              <a
                href="/reports"
                className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Back to Reports
              </a>
              {canManageReports && (
                <a
                  href={`/reports/${reportId}/edit`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Edit Report
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Report Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Project
                  </label>
                  <p className="text-neutral-900 mt-1">
                    <a
                      href={`/projects/${report.project_id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {report.project_number} - {report.project_title}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Customer
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {report.customer_name || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Report Type
                  </label>
                  <p className="text-neutral-900 mt-1 capitalize">
                    {report.report_type === "delivery_order"
                      ? "Delivery Order"
                      : "Work Done Report"}
                  </p>
                </div>
                {/* Document No shown for both types (auto-generated) */}
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    {report.report_type === "delivery_order"
                      ? "Delivery No"
                      : "Report No"}
                  </label>
                  <p className="text-neutral-900 mt-1">{computeDocNo(report)}</p>
                </div>
                {report.report_type === "delivery_order" ? (
                  <>
                    {/* Delivered Date */}
                    <div>
                      <label className="text-sm font-medium text-neutral-500">
                        Delivered Date
                      </label>
                      <p className="text-neutral-900 mt-1">
                        {formatDate(report.delivered_date)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-neutral-500">
                        Completion Date
                      </label>
                      <p className="text-neutral-900 mt-1">
                        {formatDate(report.completion_date)}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Created By
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {report.created_by_name || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    Created Date
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {formatDate(report.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Sections */}
            {report.report_type === "delivery_order" ? (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Delivery Items
                  </h3>
                  <div className="prose max-w-none">
                    <p className="text-neutral-900 whitespace-pre-wrap">
                      {report.delivery_items}
                    </p>
                  </div>
                </div>
                {report.delivery_notes && (
                  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Notes
                    </h3>
                    <div className="prose max-w-none">
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {report.delivery_notes}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Work Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Work Summary
                  </h3>
                  <div className="prose max-w-none">
                    <p className="text-neutral-900 whitespace-pre-wrap">
                      {report.work_summary}
                    </p>
                  </div>
                </div>

                {/* Materials Used */}
                {report.materials_used && (
                  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Materials Used
                    </h3>
                    <div className="prose max-w-none">
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {report.materials_used}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations && (
                  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Recommendations
                    </h3>
                    <div className="prose max-w-none">
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {report.recommendations}
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer Feedback */}
                {report.customer_feedback && (
                  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Customer Feedback
                    </h3>
                    <div className="prose max-w-none">
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {report.customer_feedback}
                      </p>
                    </div>
                  </div>
                )}

                {/* Issues Encountered */}
                {report.issues_encountered && (
                  <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Issues Encountered
                    </h3>
                    <div className="prose max-w-none">
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {report.issues_encountered}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            {canManageReports && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Status Management
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate("pending")}
                    disabled={report.status === "pending" || updating}
                    className="w-full text-left px-3 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100"
                  >
                    Mark as Pending
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("customer_signed")}
                    disabled={report.status === "customer_signed" || updating}
                    className="w-full text-left px-3 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100"
                  >
                    Mark as Customer Signed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={report.status === "completed" || updating}
                    className="w-full text-left px-3 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100"
                  >
                    Mark as Completed
                  </button>
                </div>
              </div>
            )}

            {/* Approve block for manager */}
            {userRole === "leader" && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Manager Approval
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Approve to mark the project completed and signal Accounting to
                  create an invoice.
                </p>
                <button
                  onClick={handleApprove}
                  disabled={updating || report.status === "completed"}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? "Approving..." : "Approve & Complete"}
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Related Actions
              </h3>
              <div className="space-y-2">
                <a
                  href={`/projects/${report.project_id}`}
                  className="block w-full px-3 py-2 text-sm text-left border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    View Project Details
                  </div>
                </a>
                <a
                  href={`/material-requests?project=${report.project_id}`}
                  className="block w-full px-3 py-2 text-sm text-left border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-neutral-500"
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
                  href={`/invoices/new?project=${report.project_id}`}
                  className="block w-full px-3 py-2 text-sm text-left border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v8m4-4H8m12 4a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Create Invoice for Project
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
