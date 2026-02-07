import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import DemoBanner from "@/components/DemoBanner";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    activeProjects: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  });

  // Fetch user profile with role
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;

        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching stats:", response.status, errorText);
          // Keep default stats values on error
          return;
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Keep default stats values on error
        // Set stats to default to ensure UI still works
        setStats({
          totalQuotes: 0,
          activeProjects: 0,
          pendingInvoices: 0,
          monthlyRevenue: 0,
        });
      }
    };

    if (userProfile) {
      fetchStats();
    }
  }, [userProfile]);

  // If user is not authenticated, show sign-in prompt
  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
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
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">
            Marine Engineering
          </h1>
          <p className="text-neutral-600 mb-6">
            Project Management System
          </p>
          
          {/* Demo Accounts Info */}
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-primary-800">Demo Accounts Available</span>
            </div>
            <p className="text-sm text-primary-700 mb-3">
              Try different user roles with pre-configured demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-600 rounded-full mr-2"></div>
                <span className="text-primary-700">Leader (Full Access)</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-accent-500 rounded-full mr-2"></div>
                <span className="text-primary-700">Accounting</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-400 rounded-full mr-2"></div>
                <span className="text-primary-700">Engineer</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-accent-600 rounded-full mr-2"></div>
                <span className="text-primary-700">Sales</span>
              </div>
            </div>
            <p className="text-xs text-primary-600 mt-2">
              All demo accounts use password: <strong>password123</strong>
            </p>
          </div>
          
          <div className="space-y-3">
            <a
              href="/account/signin"
              className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/account/signup"
              className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userRole = userProfile?.user_role || "sales";

  // Role-based navigation items
  const getNavigationItems = () => {
    const allItems = {
      quotations: { name: "Quotations", href: "/quotations", icon: "📋" },
      projects: { name: "Projects", href: "/projects", icon: "🏗️" },
      customers: { name: "Customers", href: "/customers", icon: "👥" },
      materials: { name: "Materials", href: "/materials", icon: "🔧" },
      materialRequests: {
        name: "Material Requests",
        href: "/material-requests",
        icon: "📦",
      },
      costs: { name: "Expenses", href: "/costs", icon: "💰" },
      invoices: { name: "Invoices", href: "/invoices", icon: "🧾" },
      reports: { name: "Project Reports", href: "/reports", icon: "📊" },
      dashboard: {
        name: "Financial Dashboard",
        href: "/financial",
        icon: "📈",
      },
    };

    switch (userRole) {
      case "leader":
        return Object.values(allItems);
      case "sales":
        return [
          allItems.quotations,
          allItems.projects,
          allItems.customers,
          allItems.materials,
          allItems.materialRequests,
          allItems.costs,
          allItems.reports,
        ];
      case "accounting":
        return [
          allItems.quotations,
          allItems.materialRequests,
          allItems.costs,
          allItems.invoices,
          allItems.reports,
          allItems.dashboard,
        ];
      case "engineer":
        return [
          allItems.quotations,
          allItems.projects,
          allItems.materialRequests,
          allItems.reports,
        ];
      default:
        return [
          allItems.quotations,
          allItems.projects,
          allItems.materialRequests,
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
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
              <h1 className="text-xl font-bold text-neutral-900">Marine Engineering</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                {userProfile?.name || userProfile?.email}
              </span>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                {userRole}
              </span>
              {userRole === "leader" && (
                <a
                  href="/settings"
                  className="text-neutral-500 hover:text-neutral-700 text-sm font-medium"
                  title="Company Settings"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </a>
              )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Banner for logged-in users */}
        {userProfile && (
          <DemoBanner user={userProfile} />
        )}

        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome back, {userProfile?.name || "User"}!
          </h2>
          <p className="text-neutral-600">
            Here's what's happening with your marine engineering projects today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary-50">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {stats.totalQuotes}
                </h3>
                <p className="text-neutral-600 text-sm">Total Quotations</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-accent-50">
                <svg
                  className="w-6 h-6 text-accent-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {stats.activeProjects}
                </h3>
                <p className="text-neutral-600 text-sm">Active Projects</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary-50">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0a2 2 0 002 2h4a2 2 0 002-2h0a2 2 0 002-2h0V9a2 2 0 00-2-2h-4a2 2 0 00-2-2m-1 4h1v4h-1z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {stats.pendingInvoices}
                </h3>
                <p className="text-neutral-600 text-sm">Pending Invoices</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-accent-100">
                <svg
                  className="w-6 h-6 text-accent-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  ${stats.monthlyRevenue.toLocaleString()}
                </h3>
                <p className="text-neutral-600 text-sm">Monthly Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {navigationItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600">
                    {item.name}
                  </h3>
                  <p className="text-neutral-600 text-sm mt-1">
                    {item.name === "Quotations" && "Create and manage quotes"}
                    {item.name === "Projects" && "Track project progress"}
                    {item.name === "Customers" && "Manage customer database"}
                    {item.name === "Materials" && "Track materials and costs"}
                    {item.name === "Material Requests" &&
                      "Request materials and operational costs"}
                    {item.name === "Expenses" &&
                      "Record project and operational expenses"}
                    {item.name === "Invoices" && "Generate and track invoices"}
                    {item.name === "Project Reports" &&
                      "Create completion reports"}
                    {item.name === "Financial Dashboard" &&
                      "View financial analytics"}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-neutral-400 group-hover:text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(userRole === "leader" || userRole === "sales") && (
              <a
                href="/quotations/new"
                className="flex items-center justify-center p-4 border border-primary-300 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Quotation
              </a>
            )}

            {(userRole === "leader" || userRole === "accounting") && (
              <a
                href="/invoices/new"
                className="flex items-center justify-center p-4 border border-accent-300 rounded-lg text-accent-700 hover:bg-accent-50 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Invoice
              </a>
            )}

            {(userRole === "leader" ||
              userRole === "engineer" ||
              userRole === "sales") && (
              <a
                href="/reports?new=1"
                className="flex items-center justify-center p-4 border border-primary-200 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Report
              </a>
            )}

            {(userRole === "engineer" ||
              userRole === "sales" ||
              userRole === "leader") && (
              <a
                href="/material-requests/new"
                className="flex items-center justify-center p-4 border border-accent-200 rounded-lg text-accent-600 hover:bg-accent-50 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Material Request
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
