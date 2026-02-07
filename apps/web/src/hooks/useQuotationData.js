import { useState, useEffect } from "react";

export function useQuotationData() {
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, materialsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/materials"),
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setMaterials(materialsData.materials || []);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load customers and materials");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { customers, materials, loading, error };
}
