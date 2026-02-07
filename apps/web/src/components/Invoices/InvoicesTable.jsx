import {
  formatCurrency,
  formatDate,
  getStatusBadge,
  isOverdue,
} from "@/utils/invoiceHelpers";

export function InvoicesTable({ invoices, canManageInvoices, onPaymentClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Paid
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-neutral-900">
                  {invoice.invoice_number}
                </div>
                <div className="text-sm text-neutral-500">
                  {formatDate(invoice.issue_date)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-neutral-900">
                  {invoice.customer_name}
                </div>
                {invoice.contact_name && (
                  <div className="text-sm text-neutral-500">
                    {invoice.contact_name}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-neutral-900">
                  {invoice.project_number || "—"}
                </div>
                {invoice.project_title && (
                  <div className="text-sm text-neutral-500 max-w-xs truncate">
                    {invoice.project_title}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {formatCurrency(invoice.total_amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                {formatCurrency(invoice.amount_paid)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`font-medium ${
                    parseFloat(invoice.balance_due || 0) > 0
                      ? "text-red-600"
                      : "text-accent-600"
                  }`}
                >
                  {formatCurrency(invoice.balance_due)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                  {getStatusBadge(invoice.status)}
                  {isOverdue(invoice) && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Overdue
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`${
                    isOverdue(invoice)
                      ? "text-red-600 font-medium"
                      : "text-neutral-900"
                  }`}
                >
                  {formatDate(invoice.due_date)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <a
                    href={`/invoices/${invoice.id}`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    View
                  </a>
                  {canManageInvoices &&
                    parseFloat(invoice.balance_due || 0) > 0 && (
                      <button
                        onClick={() => onPaymentClick(invoice)}
                        className="text-accent-600 hover:text-green-900"
                      >
                        Payment
                      </button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
