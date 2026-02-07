export function Header({ user, userRole }) {
  return (
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
              <h1 className="text-xl font-bold text-neutral-900">HVAC Manager</h1>
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
  );
}
