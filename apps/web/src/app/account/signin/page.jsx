import { useMemo } from "react";

function MainComponent() {
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const url = new URL(window.location.href);
    return url.searchParams.get("callbackUrl") || "/";
  }, []);

  // Function to fill demo credentials
  const fillDemoCredentials = (email, password) => {
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = password;
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-accent-50 p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8">
        {/* Login Form */}
        <form
          noValidate
          method="post"
          action={`/api/auth/signin/credentials-signin?callbackUrl=${callbackUrl}`}
          className="w-full lg:max-w-md rounded-2xl bg-white p-8 shadow-xl order-2 lg:order-1"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <h1 className="text-3xl font-bold text-neutral-800">Marine Engineering</h1>
            <p className="text-neutral-600 mt-2">Project Management System</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-lg outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input
                  required
                  name="password"
                  type="password"
                  className="w-full rounded-lg bg-transparent text-lg outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Sign In
            </button>

            <p className="text-center text-sm text-neutral-600">
              Don't have an account?{" "}
              <a
                href={`/account/signup?callbackUrl=${callbackUrl}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </form>

        {/* Demo Accounts Panel */}
        <div className="w-full lg:max-w-md rounded-2xl bg-white p-6 lg:p-8 shadow-xl order-1 lg:order-2">
          <div className="text-center mb-4 lg:mb-6">
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-green-600 rounded-xl mx-auto mb-3 lg:mb-4">
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-neutral-800">Demo Accounts</h2>
            <p className="text-neutral-600 mt-1 lg:mt-2 text-sm lg:text-base">Try different user roles</p>
          </div>

          <div className="space-y-3 lg:space-y-4">
            {/* Leader Account */}
            <div className="border border-neutral-200 rounded-lg p-3 lg:p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-red-600 rounded-full"></div>
                  <span className="font-semibold text-neutral-800 text-sm lg:text-base">Leader</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Full Access
                </span>
              </div>
              <p className="text-xs lg:text-sm text-neutral-600 mb-2 lg:mb-3">
                Complete system access, user management, financial reports
              </p>
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@nas2.com', 'password123')}
                className="w-full text-xs lg:text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-md transition-colors"
              >
                Use Leader Account
              </button>
              <p className="text-xs text-neutral-500 mt-1">admin@nas2.com</p>
            </div>

            {/* Accounting Account */}
            <div className="border border-neutral-200 rounded-lg p-3 lg:p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-accent-500 rounded-full"></div>
                  <span className="font-semibold text-neutral-800 text-sm lg:text-base">Accounting</span>
                </div>
                <span className="text-xs bg-accent-100 text-yellow-800 px-2 py-1 rounded-full">
                  Financial
                </span>
              </div>
              <p className="text-xs lg:text-sm text-neutral-600 mb-2 lg:mb-3">
                Financial data, invoices, project costs, approvals
              </p>
              <button
                type="button"
                onClick={() => fillDemoCredentials('accounting@nas2.com', 'password123')}
                className="w-full text-xs lg:text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-md transition-colors"
              >
                Use Accounting Account
              </button>
              <p className="text-xs text-neutral-500 mt-1">accounting@nas2.com</p>
            </div>

            {/* Engineer Account */}
            <div className="border border-neutral-200 rounded-lg p-3 lg:p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-primary-500 rounded-full"></div>
                  <span className="font-semibold text-neutral-800 text-sm lg:text-base">Engineer</span>
                </div>
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                  Technical
                </span>
              </div>
              <p className="text-xs lg:text-sm text-neutral-600 mb-2 lg:mb-3">
                Project execution, material requests, technical reports
              </p>
              <button
                type="button"
                onClick={() => fillDemoCredentials('engineer@nas2.com', 'password123')}
                className="w-full text-xs lg:text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-md transition-colors"
              >
                Use Engineer Account
              </button>
              <p className="text-xs text-neutral-500 mt-1">engineer@nas2.com</p>
            </div>

            {/* Sales Account */}
            <div className="border border-neutral-200 rounded-lg p-3 lg:p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-accent-500 rounded-full"></div>
                  <span className="font-semibold text-neutral-800 text-sm lg:text-base">Sales</span>
                </div>
                <span className="text-xs bg-accent-100 text-accent-800 px-2 py-1 rounded-full">
                  Customer
                </span>
              </div>
              <p className="text-xs lg:text-sm text-neutral-600 mb-2 lg:mb-3">
                Customer management, quotations, basic project view
              </p>
              <button
                type="button"
                onClick={() => fillDemoCredentials('sales@nas2.com', 'password123')}
                className="w-full text-xs lg:text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-md transition-colors"
              >
                Use Sales Account
              </button>
              <p className="text-xs text-neutral-500 mt-1">sales@nas2.com</p>
            </div>
          </div>

          <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-600 text-center">
              <strong>All demo accounts use password:</strong> password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
