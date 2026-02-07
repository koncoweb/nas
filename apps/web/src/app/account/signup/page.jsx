import { useMemo, useState } from "react";

function MainComponent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "sales",
  });

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/onboarding";
    const url = new URL(window.location.href);
    return url.searchParams.get("callbackUrl") || "/onboarding";
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    // minimal client-side validation before native form submit
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      formData.password !== formData.confirmPassword
    ) {
      e.preventDefault();
      alert(
        !formData.name ||
          !formData.email ||
          !formData.password ||
          !formData.confirmPassword
          ? "Please fill in all fields"
          : "Passwords do not match",
      );
      return;
    }
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingUserRole", formData.role);
      }
    } catch {}
  };

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
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-accent-50 py-8">
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
            <h1 className="text-3xl font-bold text-neutral-800">HVAC Manager</h1>
            <p className="text-neutral-600 mt-2">Create your account</p>
          </div>

          <form
            method="post"
            action={`/api/auth/callback/credentials-signup?callbackUrl=${callbackUrl}`}
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Full Name
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input
                  required
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full bg-transparent text-lg outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Email Address
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input
                  required
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-lg outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Your Role
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="dropdown-fix w-full bg-transparent text-lg outline-none text-neutral-900"
                  style={{ color: '#111827 !important' }}
                >
                  <option value="sales">Sales Team</option>
                  <option value="accounting">Accounting</option>
                  <option value="engineer">Engineer</option>
                  <option value="leader">Leader/Manager</option>
                </select>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {roleDescriptions[formData.role]}
              </p>
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
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-transparent text-lg outline-none"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Confirm Password
              </label>
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-transparent text-lg outline-none"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Create Account
            </button>

            <p className="text-center text-sm text-neutral-600">
              Already have an account?{" "}
              <a
                href={`/account/signin?callbackUrl=${callbackUrl}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
