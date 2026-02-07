"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

export default function InvoiceDetailPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState("sales");
  const [invoice, setInvoice] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "check",
    reference_number: "",
    notes: "",
  });

  const invoiceId = params.id;

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

  // Fetch invoice details
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Invoice not found");
          return;
        }
        throw new Error("Failed to fetch invoice");
      }

      const data = await response.json();
      setInvoice(data.invoice);
      setLineItems(data.line_items || []);
      setPayments(data.payments || []);
      setPaymentForm({ ...paymentForm, amount: data.invoice.balance_due });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setError("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [user, invoiceId]);

  // Handle payment submission
  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError("Valid payment amount is required");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add payment");
      }

      // Reset form and close modal
      setPaymentForm({
        amount: "",
        payment_method: "check",
        reference_number: "",
        notes: "",
      });
      setShowPaymentModal(false);

      // Refresh invoice details
      await fetchInvoiceDetails();
    } catch (error) {
      console.error("Error adding payment:", error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: "Draft", color: "bg-neutral-100 text-neutral-800" },
      sent: { label: "Sent", color: "bg-primary-100 text-primary-800" },
      partial: {
        label: "Partial Payment",
        color: "bg-accent-100 text-yellow-800",
      },
      paid: { label: "Paid", color: "bg-accent-100 text-accent-800" },
      overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", color: "bg-neutral-100 text-neutral-800" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount || 0));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Check if invoice is overdue
  const isOverdue = () => {
    if (!invoice) return false;
    if (invoice.status === "paid" || invoice.status === "cancelled")
      return false;
    if (!invoice.due_date) return false;
    return (
      new Date(invoice.due_date) < new Date() &&
      parseFloat(invoice.balance_due || 0) > 0
    );
  };

  // Loading state
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading invoice...</p>
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
          <p className="text-neutral-600 mb-4">
            Please sign in to view this invoice
          </p>
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
  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="max-w-md mx-auto">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Invoice Not Found
              </h1>
              <p className="text-neutral-600 mb-4">{error}</p>
              <a
                href="/invoices"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                ← Back to Invoices
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const canManageInvoices = userRole === "leader" || userRole === "accounting";

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
                {user.name || user.email}
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
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-neutral-500">
            <li>
              <a href="/invoices" className="hover:text-neutral-700">
                Invoices
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-neutral-900 font-medium">
              {invoice.invoice_number}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Invoice {invoice.invoice_number}
              </h1>
              <div className="flex items-center space-x-4">
                {getStatusBadge(invoice.status)}
                {isOverdue() && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {canManageInvoices &&
                parseFloat(invoice.balance_due || 0) > 0 && (
                  <button
                    onClick={() => {
                      setPaymentForm({
                        ...paymentForm,
                        amount: invoice.balance_due,
                      });
                      setShowPaymentModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Add Payment
                  </button>
                )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
              >
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Invoice Details */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Invoice Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-3">
                      Bill To:
                    </h3>
                    <div className="text-sm text-neutral-700">
                      <div className="font-medium">{invoice.customer_name}</div>
                      {invoice.contact_name && (
                        <div>Attn: {invoice.contact_name}</div>
                      )}
                      {invoice.customer_address && (
                        <div className="mt-2">
                          <div>{invoice.customer_address}</div>
                          <div>
                            {invoice.customer_city &&
                              `${invoice.customer_city}, `}
                            {invoice.customer_state} {invoice.customer_zip}
                          </div>
                        </div>
                      )}
                      {invoice.customer_email && (
                        <div className="mt-2">{invoice.customer_email}</div>
                      )}
                      {invoice.customer_phone && (
                        <div>{invoice.customer_phone}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-900">
                          Issue Date:
                        </span>
                        <span>{formatDate(invoice.issue_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-900">
                          Due Date:
                        </span>
                        <span
                          className={
                            isOverdue() ? "text-red-600 font-medium" : ""
                          }
                        >
                          {formatDate(invoice.due_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-900">
                          Payment Terms:
                        </span>
                        <span>{invoice.payment_terms}</span>
                      </div>
                      {invoice.project_number && (
                        <div className="flex justify-between">
                          <span className="font-medium text-neutral-900">
                            Project:
                          </span>
                          <span>
                            <a
                              href={`/projects/${invoice.project_id}`}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              {invoice.project_number}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Line Items
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-neutral-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-900 text-right">
                          {parseFloat(item.quantity || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-900 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-900 text-right font-medium">
                          {formatCurrency(item.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        Tax ({parseFloat(invoice.tax_rate || 0).toFixed(2)}%):
                      </span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-accent-600">
                      <span>Amount Paid:</span>
                      <span>{formatCurrency(invoice.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-red-600 border-t pt-2">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(invoice.balance_due)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                  Notes
                </h2>
                <p className="text-sm text-neutral-700">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Total Amount:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Amount Paid:</span>
                  <span className="text-sm font-medium text-accent-600">
                    {formatCurrency(invoice.amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-medium">Balance Due:</span>
                  <span
                    className={`text-sm font-semibold ${
                      parseFloat(invoice.balance_due || 0) > 0
                        ? "text-red-600"
                        : "text-accent-600"
                    }`}
                  >
                    {formatCurrency(invoice.balance_due)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Payment History
              </h2>
              {payments.length === 0 ? (
                <p className="text-sm text-neutral-500">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatDate(payment.payment_date)}
                          </div>
                          <div className="text-xs text-neutral-500 capitalize">
                            {payment.payment_method.replace("_", " ")}
                          </div>
                          {payment.reference_number && (
                            <div className="text-xs text-neutral-500">
                              Ref: {payment.reference_number}
                            </div>
                          )}
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="text-xs text-neutral-600 mt-1">
                          {payment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-neutral-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">
                Add Payment
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Balance Due: {formatCurrency(invoice.balance_due)}
              </p>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={invoice.balance_due}
                  required
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value,
                    })
                  }
                  className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                  style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                >
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paymentForm.reference_number}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      reference_number: e.target.value,
                    })
                  }
                  placeholder="Check #, transaction ID, etc."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  placeholder="Additional payment notes..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({
                      amount: "",
                      payment_method: "check",
                      reference_number: "",
                      notes: "",
                    });
                    setError("");
                  }}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing..." : "Add Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
