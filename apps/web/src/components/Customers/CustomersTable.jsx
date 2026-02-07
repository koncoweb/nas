export function CustomersTable({ customers, canCreateCustomer, onEdit }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Added
            </th>
            {canCreateCustomer && (
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-neutral-900">
                  {customer.company_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-neutral-900">
                  {customer.contact_name || "—"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-neutral-900">
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {customer.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-neutral-900">
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {customer.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-neutral-900">
                  {[customer.city, customer.state].filter(Boolean).join(", ") ||
                    "—"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {new Date(customer.created_at).toLocaleDateString()}
              </td>
              {canCreateCustomer && (
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEdit(customer)}
                    className="px-3 py-1.5 border border-neutral-300 rounded-md hover:bg-neutral-100 text-neutral-700"
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
