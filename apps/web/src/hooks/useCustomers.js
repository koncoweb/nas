import { useState, useEffect } from "react";

export function useCustomers(user, currentPage, searchTerm) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchCustomers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || {});
      setError("");
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers(currentPage, searchTerm);
    }
  }, [user, currentPage]);

  return {
    customers,
    loading,
    error,
    pagination,
    fetchCustomers,
    setError,
  };
}
