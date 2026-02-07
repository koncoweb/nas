export function CreateCustomerModal({
  show,
  creating,
  customer,
  error,
  onCustomerChange,
  onSubmit,
  onClose,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-neutral-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Add New Customer
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={customer.company_name}
              onChange={(e) =>
                onCustomerChange({ ...customer, company_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={customer.contact_name}
              onChange={(e) =>
                onCustomerChange({ ...customer, contact_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={customer.email}
              onChange={(e) =>
                onCustomerChange({ ...customer, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) =>
                onCustomerChange({ ...customer, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={customer.address}
              onChange={(e) =>
                onCustomerChange({ ...customer, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={customer.city}
                onChange={(e) =>
                  onCustomerChange({ ...customer, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={customer.state}
                onChange={(e) =>
                  onCustomerChange({ ...customer, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="State"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              value={customer.zip_code}
              onChange={(e) =>
                onCustomerChange({ ...customer, zip_code: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ZIP code"
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
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
