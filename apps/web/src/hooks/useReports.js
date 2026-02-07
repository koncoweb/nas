import { useState, useEffect } from "react";

export function useReports(
  user,
  currentPage,
  searchTerm,
  selectedStatus,
  selectedProject,
) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchReports = async (
    page = 1,
    search = "",
    status = "",
    project = "",
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

      if (project) {
        params.append("project_id", project);
      }

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
      setPagination(data.pagination || {});

      setError("");
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports(currentPage, searchTerm, selectedStatus, selectedProject);
    }
  }, [user, currentPage]);

  return {
    reports,
    loading,
    error,
    pagination,
    fetchReports,
    setError,
  };
}
