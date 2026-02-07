"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { useReports } from "@/hooks/useReports";
import { useReportForm } from "@/hooks/useReportForm";
import { useProjects } from "@/hooks/useProjects";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  getInitialReportData,
  getInitialEditReportData,
  canManageReports as checkCanManageReports,
} from "@/utils/reportHelpers";
import { Header } from "@/components/Reports/Header";
import { PageHeader } from "@/components/Reports/PageHeader";
import { SearchFilters } from "@/components/Reports/SearchFilters";
import { ReportsTable } from "@/components/Reports/ReportsTable";
import { Pagination } from "@/components/Reports/Pagination";
import { EmptyState } from "@/components/Reports/EmptyState";
import { LoadingState } from "@/components/Reports/LoadingState";
import { CreateReportModal } from "@/components/Reports/CreateReportModal";
import { EditReportModal } from "@/components/Reports/EditReportModal";

export default function ReportsPage() {
  const { data: user, loading: userLoading } = useUser();
  const { userRole } = useUserProfile(user);
  const { projects } = useProjects(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { reports, loading, error, pagination, fetchReports, setError } =
    useReports(user, currentPage, searchTerm, selectedStatus, selectedProject);

  const createForm = useReportForm(getInitialReportData(), async () => {
    setShowCreateModal(false);
    await fetchReports(
      currentPage,
      searchTerm,
      selectedStatus,
      selectedProject,
    );
  });

  const editForm = useReportForm(getInitialEditReportData(), async () => {
    setShowEditModal(false);
    await fetchReports(
      currentPage,
      searchTerm,
      selectedStatus,
      selectedProject,
    );
  });

  // Open create modal if ?new=1 is present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "1") {
        setShowCreateModal(true);
      }
    }
  }, []);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchReports(1, searchTerm, selectedStatus, selectedProject);
  };

  // Handle filter changes
  const handleStatusChange = async (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    await fetchReports(1, searchTerm, status, selectedProject);
  };

  const handleProjectChange = async (project) => {
    setSelectedProject(project);
    setCurrentPage(1);
    await fetchReports(1, searchTerm, selectedStatus, project);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedProject("");
    setCurrentPage(1);
    fetchReports(1, "", "", "");
  };

  // Handle create report
  const handleCreateReport = async (e) => {
    e.preventDefault();
    await createForm.submitCreate();
  };

  // Handle update report
  const handleUpdateReport = async (e) => {
    e.preventDefault();
    await editForm.submitUpdate(editForm.formData.id);
  };

  // Handle edit modal open
  const openEditModal = (report) => {
    editForm.setFormData({
      id: report.id,
      project_id: report.project_id,
      report_type: report.report_type || "work_done",
      completion_date: report.completion_date || "",
      work_summary: report.work_summary || "",
      materials_used: report.materials_used || "",
      recommendations: report.recommendations || "",
      customer_feedback: report.customer_feedback || "",
      issues_encountered: report.issues_encountered || "",
      // delivery order fields
      delivery_number: report.delivery_number || "",
      delivered_date: report.delivered_date || "",
      delivery_items: report.delivery_items || "",
      delivery_notes: report.delivery_notes || "",
      status: report.status || "pending",
    });
    setShowEditModal(true);
    setError("");
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    createForm.resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    editForm.setError("");
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Loading state
  if (userLoading || (loading && reports.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading reports...</p>
            </div>
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

  const canManageReports = checkCanManageReports(userRole);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          canManageReports={canManageReports}
          onCreateClick={() => setShowCreateModal(true)}
        />

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          selectedProject={selectedProject}
          projects={projects}
          onSearch={handleSearch}
          onStatusChange={handleStatusChange}
          onProjectChange={handleProjectChange}
          onClear={handleClearFilters}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : reports.length === 0 ? (
            <EmptyState
              searchTerm={searchTerm}
              selectedStatus={selectedStatus}
              selectedProject={selectedProject}
              canManageReports={canManageReports}
              onCreateClick={() => setShowCreateModal(true)}
            />
          ) : (
            <>
              <ReportsTable
                reports={reports}
                canManageReports={canManageReports}
                onEditClick={openEditModal}
              />
              <Pagination
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      <CreateReportModal
        show={showCreateModal}
        onClose={handleCloseCreateModal}
        formData={createForm.formData}
        updateField={createForm.updateField}
        projects={projects}
        error={createForm.error}
        submitting={createForm.submitting}
        onSubmit={handleCreateReport}
      />

      <EditReportModal
        show={showEditModal}
        onClose={handleCloseEditModal}
        formData={editForm.formData}
        updateField={editForm.updateField}
        error={editForm.error}
        submitting={editForm.submitting}
        onSubmit={handleUpdateReport}
      />
    </div>
  );
}
