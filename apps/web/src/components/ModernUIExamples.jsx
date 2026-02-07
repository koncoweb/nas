/**
 * Contoh Komponen Modern UI dengan Styling Baru
 * File ini berisi contoh-contoh penggunaan komponen dengan tema biru korporat
 */

export function ModernButton() {
  return (
    <div className="space-y-4">
      {/* Primary Button */}
      <button className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Primary Button
      </button>

      {/* Secondary Button */}
      <button className="inline-flex items-center px-4 py-2 bg-white hover:bg-neutral-50 text-primary-600 font-medium rounded-lg border border-primary-600 transition-all duration-200">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Secondary Button
      </button>

      {/* Outline Button */}
      <button className="inline-flex items-center px-4 py-2 bg-transparent hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg border border-neutral-300 transition-all duration-200">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Details
      </button>
    </div>
  );
}

export function ModernCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Card Title</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
          Active
        </span>
      </div>
      <p className="text-neutral-600 mb-4">
        This is a modern card component with clean styling and smooth hover effects.
      </p>
      <div className="flex items-center space-x-2">
        <button className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all duration-200">
          Action
        </button>
        <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-all duration-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ModernInput() {
  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email"
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Select Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Category
        </label>
        <select className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white">
          <option value="">Select a category</option>
          <option value="1">Category 1</option>
          <option value="2">Category 2</option>
        </select>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          rows={4}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none"
          placeholder="Enter description..."
        />
      </div>
    </div>
  );
}

export function ModernBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Active
      </span>
      
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-700">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Success
      </span>
      
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-700">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pending
      </span>
      
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Rejected
      </span>
      
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Info
      </span>
    </div>
  );
}

export function ModernTable() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          <tr className="hover:bg-neutral-50 transition-colors duration-150">
            <td className="px-6 py-4 text-sm text-neutral-900 font-medium">
              John Doe
            </td>
            <td className="px-6 py-4 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                Active
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-neutral-600">
              2024-02-07
            </td>
            <td className="px-6 py-4 text-sm text-right">
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                View
              </button>
            </td>
          </tr>
          <tr className="hover:bg-neutral-50 transition-colors duration-150">
            <td className="px-6 py-4 text-sm text-neutral-900 font-medium">
              Jane Smith
            </td>
            <td className="px-6 py-4 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                Pending
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-neutral-600">
              2024-02-06
            </td>
            <td className="px-6 py-4 text-sm text-right">
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ModernAlert() {
  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800">Information</h3>
            <p className="mt-1 text-sm text-primary-700">
              This is an informational message with the new primary color scheme.
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-accent-800">Success</h3>
            <p className="mt-1 text-sm text-accent-700">
              Your changes have been saved successfully.
            </p>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
            <p className="mt-1 text-sm text-accent-700">
              Please review your information before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">
              There was an error processing your request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModernIconButtons() {
  return (
    <div className="flex items-center space-x-2">
      {/* Edit Button */}
      <button className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Delete Button */}
      <button className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Download Button */}
      <button className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {/* Settings Button */}
      <button className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
