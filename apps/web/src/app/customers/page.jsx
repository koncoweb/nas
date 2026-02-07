"use client";

import { useState } from "react";
import useUser from "@/utils/useUser";
import { useUserRole } from "@/hooks/useUserRole";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerForm } from "@/hooks/useCustomerForm";
import { useCustomerEdit } from "@/hooks/useCustomerEdit";
import { Header } from "@/components/Customers/Header";
import { PageHeader } from "@/components/Customers/PageHeader";
import { SearchFilters } from "@/components/Customers/SearchFilters";
import { LoadingState } from "@/components/Customers/LoadingState";
import { EmptyState } from "@/components/Customers/EmptyState";
import { CustomersTable } from "@/components/Customers/CustomersTable";
import { Pagination } from "@/components/Customers/Pagination";
import { CreateCustomerModal } from "@/components/Customers/CreateCustomerModal";
import { EditCustomerModal } from "@/components/Customers/EditCustomerModal";

export default function CustomersPage() {
  const { data: user, loading: userLoading } = useUser();
  const userRole = useUserRole(user);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { customers, loading, error, pagination, fetchCustomers, setError } =
    useCustomers(user, currentPage, searchTerm);

  const {
    showCreateModal,
    setShowCreateModal,
    creating,
    newCustomer,
    setNewCustomer,
    error: createError,
    handleCreateCustomer,
    resetForm,
  } = useCustomerForm(() => fetchCustomers(currentPage, searchTerm));

  const {
    showEditModal,
    editing,
    editError,
    editCustomer,
    setEditCustomer,
    openEditModal,
    handleUpdateCustomer,
    closeEditModal,
  } = useCustomerEdit(() => fetchCustomers(currentPage, searchTerm));

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchCustomers(1, searchTerm);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchCustomers(1, "");
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Loading state
  if (userLoading || (loading && customers.length === 0)) {
    return <LoadingState />;
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Please sign in to view customers</p>
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

  const canCreateCustomer = userRole === "leader" || userRole === "sales";

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          canCreateCustomer={canCreateCustomer}
          onAddCustomer={() => setShowCreateModal(true)}
        />

        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          onClear={handleClearSearch}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              searchTerm={searchTerm}
              canCreateCustomer={canCreateCustomer}
              onAddCustomer={() => setShowCreateModal(true)}
            />
          ) : (
            <>
              <CustomersTable
                customers={customers}
                canCreateCustomer={canCreateCustomer}
                onEdit={openEditModal}
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

      <CreateCustomerModal
        show={showCreateModal}
        creating={creating}
        customer={newCustomer}
        error={createError}
        onCustomerChange={setNewCustomer}
        onSubmit={handleCreateCustomer}
        onClose={resetForm}
      />

      <EditCustomerModal
        show={showEditModal}
        editing={editing}
        customer={editCustomer}
        error={editError}
        onCustomerChange={setEditCustomer}
        onSubmit={handleUpdateCustomer}
        onClose={closeEditModal}
      />
    </div>
  );
}
