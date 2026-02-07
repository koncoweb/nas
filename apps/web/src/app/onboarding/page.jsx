import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState("sales");

  useEffect(() => {
    // Load pending role from localStorage (set during signup)
    if (typeof window !== "undefined") {
      const pendingRole = localStorage.getItem("pendingUserRole");
      if (pendingRole) {
        setUserRole(pendingRole);
      }
    }
  }, []);

  const saveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_role: userRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Clear the pending role from localStorage
      localStorage.removeItem("pendingUserRole");
      setSuccess(true);

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProfile();
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-accent-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-accent-50">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Please sign in to continue</p>
          <a
            href="/account/signin"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-accent-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Welcome to HVAC Manager!
            </h1>
            <p className="text-neutral-600 mb-4">
              Your account has been set up successfully.
            </p>
            <p className="text-sm text-neutral-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const roleDescriptions = {
    leader: "Full access to all features and data across the entire system",
    sales:
      "Create quotations, manage customer relationships, and track project progress",
    accounting:
      "Handle invoicing, payments, cost tracking, and financial reports",
    engineer:
      "Create completion reports, manage project execution, and access project details",
  };

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
            <h1 className="text-3xl font-bold text-neutral-800">Almost Done!</h1>
            <p className="text-neutral-600 mt-2">
              Confirm your role to complete setup
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-lg font-medium text-neutral-800 mb-2">
                Welcome, {user.name || user.email}!
              </p>
              <p className="text-neutral-600 mb-4">
                Please confirm your role in the HVAC management system:
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Your Role
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-transparent text-lg outline-none text-neutral-900"
                >
                  <option value="sales">Sales Team</option>
                  <option value="accounting">Accounting</option>
                  <option value="engineer">Engineer</option>
                  <option value="leader">Leader/Manager</option>
                </select>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {roleDescriptions[userRole]}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
