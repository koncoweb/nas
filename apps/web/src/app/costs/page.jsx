"use client";

import { useMemo, useState } from "react";
import useUser from "@/utils/useUser";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const queryClientSingleton = new QueryClient();

function CostsInnerPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    cost_type: "",
    expense_type: "", // '', 'project', 'operational'
    project_id: "",
    from: "",
    to: "",
    page: 1,
    limit: 10,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    expense_type: "project", // 'project' | 'operational'
    category: "other", // for operational categorization
    project_id: "",
    cost_type: "material",
    description: "",
    quantity: 1,
    unit_cost: 0,
    purchase_date: new Date().toISOString().split("T")[0],
    vendor: "",
    receipt_number: "",
  });

  const costTypes = [
    "labor",
    "material",
    "equipment",
    "subcontractor",
    "travel",
    "other",
  ];

  const opCategories = [
    { value: "salary", label: "Salary" },
    { value: "marketing", label: "Marketing" },
    { value: "admin", label: "Administrative" },
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "travel", label: "Travel" },
    { value: "other", label: "Other" },
  ];

  // Fetch projects for dropdown (completed or all)
  const { data: projectsData } = useQuery({
    queryKey: ["projects-for-costs"],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=1000", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: !!user,
  });
  const projects = projectsData?.projects || [];

  // Fetch costs
  const { data, isLoading, error } = useQuery({
    queryKey: ["costs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      const res = await fetch(`/api/costs-fixed?${params.toString()}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch costs");
      return res.json();
    },
    enabled: !!user,
    keepPreviousData: true,
  });

  const costs = data?.costs || [];
  const pagination = data?.pagination || {
    page: 1,
    pages: 1,
    limit: 10,
    total: 0,
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/costs-fixed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to create expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      setShowCreate(false);
      setForm({
        expense_type: "project",
        category: "other",
        project_id: "",
        cost_type: "material",
        description: "",
        quantity: 1,
        unit_cost: 0,
        purchase_date: new Date().toISOString().split("T")[0],
        vendor: "",
        receipt_number: "",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await fetch(`/api/costs-fixed/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include"
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to update expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.description.trim()) return alert("Description is required");

    const isOperational = form.expense_type === "operational";
    if (!isOperational && !form.project_id)
      return alert("Project is required for project expenses");

    // Map operational category to supported cost_type where possible
    let costType = form.cost_type;
    if (isOperational) {
      if (form.category === "salary") costType = "labor";
      else if (form.category === "travel") costType = "travel";
      else costType = "other";
    }

    createMutation.mutate({
      expense_type: form.expense_type,
      category: isOperational ? form.category : null,
      project_id: isOperational ? null : form.project_id,
      cost_type: costType,
      description: form.description,
      quantity: Number(form.quantity || 0),
      unit_cost: Number(form.unit_cost || 0),
      purchase_date: form.purchase_date,
      vendor: form.vendor,
      receipt_number: form.receipt_number,
    });
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(n || 0));
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  // Loading & auth states
  if (userLoading || (isLoading && !data)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading expenses...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Please sign in to view expenses</p>
          <a
            href="/account/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
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
                <h1 className="text-xl font-bold text-neutral-900">
                  HVAC Manager
                </h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                {user.name || user.email}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Expenses</h1>
            <p className="mt-2 text-neutral-600">
              Project and operational expenses with manager approval
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Add Expense
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
              }
              placeholder="Search description, vendor, receipt #"
              className="md:col-span-2 w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={filters.cost_type}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  cost_type: e.target.value,
                  page: 1,
                }))
              }
              className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
              style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
            >
              <option value="">All Types</option>
              {costTypes.map((ct) => (
                <option key={ct} value={ct}>
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={filters.expense_type}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  expense_type: e.target.value,
                  page: 1,
                }))
              }
              className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
              style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
            >
              <option value="">All Expenses</option>
              <option value="project">Project</option>
              <option value="operational">Operational</option>
            </select>
            <select
              value={filters.project_id}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  project_id: e.target.value,
                  page: 1,
                }))
              }
              className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
              style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} - {p.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              />
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {String(error.message || error)}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {costs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-neutral-600"
                    >
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  costs.map((c) => {
                    const badge =
                      c.approval_status === "approved"
                        ? "bg-accent-100 text-accent-700"
                        : c.approval_status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-accent-100 text-accent-700";
                    return (
                      <tr key={c.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(c.purchase_date)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {c.project_number ? `${c.project_number}` : "—"}
                          <div className="text-xs text-neutral-500 truncate max-w-[200px]">
                            {c.project_title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                          {c.cost_type}
                        </td>
                        <td
                          className="px-6 py-4 text-sm max-w-[260px] truncate"
                          title={c.description}
                        >
                          {c.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {Number(c.quantity || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatCurrency(c.unit_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(c.total_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {c.vendor || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full ${badge}`}>
                              {c.approval_status}
                            </span>
                            {c.approval_status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    updateMutation.mutate({
                                      id: c.id,
                                      updates: { approval_status: "approved" },
                                    })
                                  }
                                  className="px-2 py-0.5 text-xs rounded border border-accent-300 text-accent-700 hover:bg-accent-50"
                                  title="Approve"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    updateMutation.mutate({
                                      id: c.id,
                                      updates: { approval_status: "rejected" },
                                    })
                                  }
                                  className="px-2 py-0.5 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50"
                                  title="Reject"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                Page {pagination.page} of {pagination.pages} •{" "}
                {pagination.total} items
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
                  }
                  disabled={filters.page <= 1}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => i + 1,
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    className={`px-3 py-1 text-sm border rounded-md ${filters.page === p ? "bg-primary-600 text-white border-primary-600" : "border-neutral-300 hover:bg-neutral-100"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      page: Math.min(pagination.pages, f.page + 1),
                    }))
                  }
                  disabled={filters.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Add Expense
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Expense Type *
                  </label>
                  <select
                    value={form.expense_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expense_type: e.target.value }))
                    }
                    className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
                    style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                  >
                    <option value="project">Project</option>
                    <option value="operational">Operational</option>
                  </select>
                </div>

                {form.expense_type === "project" ? (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Project *
                    </label>
                    <select
                      value={form.project_id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, project_id: e.target.value }))
                      }
                      required={form.expense_type === "project"}
                      className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
                      style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.project_number} - {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
                      style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                    >
                      {opCategories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={form.cost_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cost_type: e.target.value }))
                    }
                    className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-md text-neutral-900 bg-white"
                    style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                  >
                    {costTypes.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct.charAt(0).toUpperCase() + ct.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, purchase_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    placeholder="Describe the expense..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_cost}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit_cost: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vendor: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Receipt #
                  </label>
                  <input
                    type="text"
                    value={form.receipt_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, receipt_number: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
              </div>

              {createMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {createMutation.error.message}
                </div>
              )}

              <div className="flex justify-end space-y-0 space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isLoading ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CostsPage() {
  return (
    <QueryClientProvider client={queryClientSingleton}>
      <CostsInnerPage />
    </QueryClientProvider>
  );
}
