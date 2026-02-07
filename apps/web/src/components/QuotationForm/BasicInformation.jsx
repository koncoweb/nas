export function BasicInformation({ formData, customers, onInputChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Cover Letter (Page 1)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quotation No (auto after save) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Quotation No
          </label>
          <input
            type="text"
            name="quote_number"
            value={formData.quote_number || "Auto after save"}
            onChange={onInputChange}
            disabled
            className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-neutral-600 rounded-md focus:outline-none"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Date
          </label>
          <input
            type="date"
            name="issue_date"
            value={formData.issue_date || ""}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="customer_id"
            value={formData.customer_id}
            onChange={onInputChange}
            required
            className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
            style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
          >
            <option value="" style={{ color: '#6b7280' }}>Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id} style={{ color: '#111827' }}>
                {customer.company_name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency selection - applies only to this quotation */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={onInputChange}
            className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
            style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
          >
            <option value="IDR" style={{ color: '#111827' }}>Rp (IDR)</option>
            <option value="SGD" style={{ color: '#111827' }}>S$ (SGD)</option>
            <option value="USD" style={{ color: '#111827' }}>US$ (USD)</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            This applies only to this new quotation. Other quotations keep their
            own currency, and the Financial Dashboard shows each currency
            separately.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={onInputChange}
            placeholder="e.g., Marcopolo Shipyard Batam"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Service Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            placeholder="e.g., ECR PACKAGE UNIT AIR CONDITIONER"
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Vessel Name
          </label>
          <input
            type="text"
            name="vessel_name"
            value={formData.vessel_name}
            onChange={onInputChange}
            placeholder="e.g., HR SAHERA"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* REMOVED Service Type select per new structure */}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Revision
          </label>
          <input
            type="number"
            name="revision_number"
            value={formData.revision_number}
            onChange={onInputChange}
            min="0"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Introduction Letter
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={4}
          placeholder="Write a short cover letter for this quotation…"
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
