"use client";

import { useMemo, useState } from "react";
import useUser from "@/utils/useUser";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function fetchJson(url, options = {}) {
  return async () => {
    const res = await fetch(url, { credentials: "include", ...options });
    if (!res.ok) {
      throw new Error(
        `When fetching ${url}, the response was [${res.status}] ${res.statusText}`,
      );
    }
    return res.json();
  };
}

function useFinancialData() {
  const statsQuery = useQuery({
    queryKey: ["financial", "stats"],
    queryFn: fetchJson("/api/dashboard/stats"),
  });
  const invoicesQuery = useQuery({
    queryKey: ["financial", "invoices"],
    queryFn: fetchJson("/api/invoices?limit=200"),
  });
  const costsQuery = useQuery({
    queryKey: ["financial", "costs"],
    queryFn: fetchJson("/api/costs-fixed?limit=200"),
  });
  // NEW: summary for P&L and cash flow
  const summaryQuery = useQuery({
    queryKey: ["financial", "summary"],
    queryFn: fetchJson("/api/financial/summary"),
  });
  return { statsQuery, invoicesQuery, costsQuery, summaryQuery };
}

function formatCurrency(n) {
  const amount = parseFloat(n || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function isOverdue(invoice) {
  if (!invoice?.due_date) return false;
  if (invoice.status === "paid" || invoice.status === "cancelled") return false;
  try {
    return (
      new Date(invoice.due_date) < new Date() &&
      parseFloat(invoice.balance_due || 0) > 0
    );
  } catch (e) {
    return false;
  }
}

function FinancialContent() {
  const { data: user, loading: userLoading } = useUser();
  const { statsQuery, invoicesQuery, costsQuery, summaryQuery } =
    useFinancialData();

  const loading =
    userLoading ||
    statsQuery.isLoading ||
    invoicesQuery.isLoading ||
    costsQuery.isLoading ||
    summaryQuery.isLoading;
  const error =
    statsQuery.error ||
    invoicesQuery.error ||
    costsQuery.error ||
    summaryQuery.error;

  const invoices = invoicesQuery.data?.invoices || [];
  const costs =
    costsQuery.data?.costs || costsQuery.data?.items || costsQuery.data || [];
  const stats = statsQuery.data || {
    totalQuotes: 0,
    activeProjects: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  };
  const summary = summaryQuery.data || {
    company: {
      revenue_total: 0,
      expense_total: 0,
      cost_project_total: 0,
      cost_operational_total: 0,
      profit: 0,
      margin: 0,
    },
    projects: [],
    cash_flow: [],
  };

  // Derived datasets
  const statusDistribution = useMemo(() => {
    const groups = invoices.reduce((acc, inv) => {
      const key = inv.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const paidVsBalance = useMemo(() => {
    const totals = invoices.reduce(
      (acc, inv) => {
        acc.paid += parseFloat(inv.amount_paid || 0);
        acc.balance += parseFloat(inv.balance_due || 0);
        return acc;
      },
      { paid: 0, balance: 0 },
    );
    return [
      { name: "Paid", value: parseFloat(totals.paid.toFixed(2)) },
      { name: "Balance Due", value: parseFloat(totals.balance.toFixed(2)) },
    ];
  }, [invoices]);

  const costsByType = useMemo(() => {
    const groups = costs.reduce((acc, c) => {
      const key = c.cost_type || "other";
      acc[key] = (acc[key] || 0) + parseFloat(c.total_cost || 0);
      return acc;
    }, {});
    return Object.entries(groups).map(([type, total]) => ({
      type,
      total: parseFloat(total.toFixed(2)),
    }));
  }, [costs]);

  const overdueInvoices = useMemo(
    () => invoices.filter(isOverdue).slice(0, 5),
    [invoices],
  );
  const recentCosts = useMemo(
    () =>
      Array.isArray(costs)
        ? [...costs]
            .sort(
              (a, b) =>
                new Date(b.created_at || b.purchase_date || 0) -
                new Date(a.created_at || a.purchase_date || 0),
            )
            .slice(0, 5)
        : [],
    [costs],
  );

  // NEW: cash flow chart data
  const cashFlowData =
    summary.cash_flow?.map((m) => ({
      month: m.month,
      Inflow: m.inflow,
      Outflow: m.outflow,
      Net: m.net,
    })) || [];

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">
            Please sign in to view the financial dashboard
          </p>
          <a
            href="/account/signin"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading financial data...</p>
            </div>
          </div>
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
                {user?.name || user?.email}
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Financial Dashboard
              </h1>
              <p className="mt-2 text-neutral-600">
                Company P&L, project profitability, and cash flow
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error && error.message ? error.message : "Failed to load data"}
          </div>
        )}

        {/* NEW: Company P&L cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Company Revenue</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(summary.company.revenue_total)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Total Expenses</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(summary.company.expense_total)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Projects: {formatCurrency(summary.company.cost_project_total)} •
              Operational:{" "}
              {formatCurrency(summary.company.cost_operational_total)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Profit</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(summary.company.profit)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Margin</div>
            <div className="text-2xl font-bold mt-1">
              {(summary.company.margin * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Existing Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Total Quotations</div>
            <div className="text-2xl font-bold mt-1">{stats.totalQuotes}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Active Projects</div>
            <div className="text-2xl font-bold mt-1">
              {stats.activeProjects}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Pending Invoices</div>
            <div className="text-2xl font-bold mt-1">
              {stats.pendingInvoices}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-neutral-600 text-sm">Monthly Revenue</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expenses by Type */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Expenses by Type
              </h3>
            </div>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costsByType}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Invoice Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Invoice Status
              </h3>
            </div>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#60a5fa",
                            "#34d399",
                            "#f59e0b",
                            "#ef4444",
                            "#a78bfa",
                            "#94a3b8",
                          ][index % 6]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Paid vs Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Paid vs Balance
            </h3>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={paidVsBalance}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NEW: Cash Flow */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Cash Flow (last 6 months)
            </h3>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cashFlowData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Inflow" fill="#22c55e" />
                <Bar dataKey="Outflow" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NEW: Project P&L table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">
              Project Profit & Loss
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                    Revenue
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                    Cost
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                    Profit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {summary.projects.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-neutral-500" colSpan={5}>
                      No project data
                    </td>
                  </tr>
                ) : (
                  summary.projects.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm">
                        <a
                          className="text-primary-600 hover:underline"
                          href={`/projects/${p.id}`}
                        >
                          {p.project_number}
                        </a>
                        <div className="text-xs text-neutral-500 truncate max-w-[260px]">
                          {p.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(p.cost)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(p.profit)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(p.margin * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Overdue Invoices */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">
                Overdue Invoices
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                      Invoice
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                      Due
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {overdueInvoices.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-neutral-500" colSpan={3}>
                        No overdue invoices
                      </td>
                    </tr>
                  ) : (
                    overdueInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-sm">
                          <a
                            className="text-primary-600 hover:underline"
                            href={`/invoices/${inv.id}`}
                          >
                            {inv.invoice_number}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(inv.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-red-600">
                          {formatCurrency(inv.balance_due)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">
                Recent Expenses
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {recentCosts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-neutral-500" colSpan={3}>
                        No recent expenses
                      </td>
                    </tr>
                  ) : (
                    recentCosts.map((c, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-sm">
                          {c.purchase_date
                            ? new Date(c.purchase_date).toLocaleDateString()
                            : c.created_at
                              ? new Date(c.created_at).toLocaleDateString()
                              : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">
                          {c.cost_type || "other"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatCurrency(c.total_cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialPage() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialContent />
    </QueryClientProvider>
  );
}
