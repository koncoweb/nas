import { useState, useEffect } from "react";

export function useInvoices(
  user,
  currentPage,
  searchTerm,
  selectedStatus,
  selectedCustomer,
) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchInvoices = async (
    page = 1,
    search = "",
    status = "",
    customer = "",
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (customer) {
        params.append("customer_id", customer);
      }

      const response = await fetch(`/api/invoices?${params}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
      setPagination(data.pagination || {});

      setError("");
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvoices(currentPage, searchTerm, selectedStatus, selectedCustomer);
    }
  }, [user, currentPage]);

  return {
    invoices,
    loading,
    error,
    pagination,
    fetchInvoices,
    setError,
  };
}
