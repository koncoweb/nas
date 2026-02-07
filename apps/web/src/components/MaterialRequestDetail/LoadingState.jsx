import { Header } from "./Header";

export function LoadingState({ userProfile, userRole }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header userProfile={userProfile} userRole={userRole} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading material request...</p>
        </div>
      </div>
    </div>
  );
}
