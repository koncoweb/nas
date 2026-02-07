import { useState, useEffect } from "react";

export function useMaterials(user, currentPage, searchTerm, selectedCategory) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchMaterials = async (page = 1, search = "", category = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (category) {
        params.append("category", category);
      }

      const response = await fetch(`/api/materials?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch materials");
      }

      const data = await response.json();
      setMaterials(data.materials || []);
      setPagination(data.pagination || {});

      // Extract unique categories for filter
      const uniqueCategories = [
        ...new Set(
          (data.materials || []).map((m) => m.category).filter(Boolean),
        ),
      ].sort();
      setCategories(uniqueCategories);

      setError("");
    } catch (error) {
      console.error("Error fetching materials:", error);
      setError("Failed to load materials");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMaterials(currentPage, searchTerm, selectedCategory);
    }
  }, [user, currentPage]);

  return {
    materials,
    loading,
    error,
    categories,
    pagination,
    fetchMaterials,
    setError,
  };
}
