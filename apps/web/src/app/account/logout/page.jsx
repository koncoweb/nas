function MainComponent() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-accent-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
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
            <h1 className="text-3xl font-bold text-neutral-800">Sign Out</h1>
            <p className="text-neutral-600 mt-2">
              Click the button below to sign out.
            </p>
          </div>

          <div className="text-center space-y-3">
            {/* Post directly to the auth endpoint to avoid confirmation loops */}
            <form
              method="post"
              action="/api/auth/signout"
              className="space-y-3"
            >
              <input type="hidden" name="callbackUrl" value="/account/signin" />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Sign Out
              </button>
            </form>
            <a
              href="/"
              className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
