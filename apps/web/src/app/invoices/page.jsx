"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { useInvoices } from "@/hooks/useInvoices";
import { useInvoiceData } from "@/hooks/useInvoiceData";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { usePaymentForm } from "@/hooks/usePaymentForm";
import { InvoicesHeader } from "@/components/Invoices/Header";
import { InvoicesPageHeader } from "@/components/Invoices/PageHeader";
import { SearchFilters } from "@/components/Invoices/SearchFilters";
import { InvoicesTable } from "@/components/Invoices/InvoicesTable";
import { Pagination } from "@/components/Invoices/Pagination";
import { EmptyState } from "@/components/Invoices/EmptyState";
import { LoadingState } from "@/components/Invoices/LoadingState";
import { CreateInvoiceModal } from "@/components/Invoices/CreateInvoiceModal";
import { PaymentModal } from "@/components/Invoices/PaymentModal";

export default function InvoicesPage() {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { invoices, loading, error, pagination, fetchInvoices, setError } =
    useInvoices(
      user,
      currentPage,
      searchTerm,
      selectedStatus,
      selectedCustomer,
    );

  const { projects, customers } = useInvoiceData(user);

  const {
    newInvoice,
    setNewInvoice,
    updateLineItem,
    addLineItem,
    removeLineItem,
    resetForm,
  } = useInvoiceForm();

  const {
    selectedInvoice,
    paymentAmount,
    paymentMethod,
    paymentRef,
    paymentNotes,
    setPaymentAmount,
    setPaymentMethod,
    setPaymentRef,
    setPaymentNotes,
    resetPaymentForm,
    initializePayment,
  } = usePaymentForm();

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

  // Handle search and filters
  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchInvoices(1, searchTerm, selectedStatus, selectedCustomer);
  };

  const handleStatusChange = async (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    await fetchInvoices(1, searchTerm, status, selectedCustomer);
  };

  const handleCustomerChange = async (customer) => {
    setSelectedCustomer(customer);
    setCurrentPage(1);
    await fetchInvoices(1, searchTerm, selectedStatus, customer);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedCustomer("");
    setCurrentPage(1);
    fetchInvoices(1, "", "", "");
  };

  // Handle create invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    if (!newInvoice.customer_id) {
      setError("Customer selection is required");
      return;
    }

    if (!newInvoice.line_items.some((item) => item.description.trim())) {
      setError("At least one line item with description is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newInvoice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invoice");
      }

      resetForm();
      setShowCreateModal(false);

      await fetchInvoices(
        currentPage,
        searchTerm,
        selectedStatus,
        selectedCustomer,
      );
    } catch (error) {
      console.error("Error creating invoice:", error);
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Handle payment
  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Valid payment amount is required");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const response = await fetch(
        `/api/invoices/${selectedInvoice.id}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(paymentAmount),
            payment_method: paymentMethod,
            reference_number: paymentRef,
            notes: paymentNotes,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add payment");
      }

      resetPaymentForm();
      setShowPaymentModal(false);

      await fetchInvoices(
        currentPage,
        searchTerm,
        selectedStatus,
        selectedCustomer,
      );
    } catch (error) {
      console.error("Error adding payment:", error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePaymentClick = (invoice) => {
    initializePayment(invoice);
    setShowPaymentModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setError("");
    resetForm();
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    resetPaymentForm();
    setError("");
  };

  // Loading state
  if (userLoading || (loading && invoices.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading invoices...</p>
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
          <p className="text-neutral-600 mb-4">Please sign in to view invoices</p>
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

  const canManageInvoices = userRole === "leader" || userRole === "accounting";
  const hasFilters = searchTerm || selectedStatus || selectedCustomer;

  return (
    <div className="min-h-screen bg-neutral-50">
      <InvoicesHeader user={user} userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvoicesPageHeader
          canManageInvoices={canManageInvoices}
          onCreateClick={() => setShowCreateModal(true)}
        />

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          selectedCustomer={selectedCustomer}
          customers={customers}
          onSearch={handleSearch}
          onStatusChange={handleStatusChange}
          onCustomerChange={handleCustomerChange}
          onClear={handleClearFilters}
        />

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : invoices.length === 0 ? (
            <EmptyState
              hasFilters={hasFilters}
              canManageInvoices={canManageInvoices}
              onCreateClick={() => setShowCreateModal(true)}
            />
          ) : (
            <>
              <InvoicesTable
                invoices={invoices}
                canManageInvoices={canManageInvoices}
                onPaymentClick={handlePaymentClick}
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

      <CreateInvoiceModal
        show={showCreateModal}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateInvoice}
        creating={creating}
        error={error}
        newInvoice={newInvoice}
        setNewInvoice={setNewInvoice}
        updateLineItem={updateLineItem}
        addLineItem={addLineItem}
        removeLineItem={removeLineItem}
        customers={customers}
        projects={projects}
      />

      <PaymentModal
        show={showPaymentModal}
        onClose={handleClosePaymentModal}
        onSubmit={handleAddPayment}
        processing={processing}
        error={error}
        selectedInvoice={selectedInvoice}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentRef={paymentRef}
        setPaymentRef={setPaymentRef}
        paymentNotes={paymentNotes}
        setPaymentNotes={setPaymentNotes}
      />
    </div>
  );
}
