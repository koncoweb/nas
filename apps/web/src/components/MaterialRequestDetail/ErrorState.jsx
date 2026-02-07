import { Header } from "./Header";

export function ErrorState({ userProfile, userRole, error }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header userProfile={userProfile} userRole={userRole} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
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
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Material Request Not Found
          </h2>
          <p className="text-neutral-600 mb-4">
            {error || "The material request you're looking for doesn't exist."}
          </p>
          <a
            href="/material-requests"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Material Requests
          </a>
        </div>
      </div>
    </div>
  );
}
