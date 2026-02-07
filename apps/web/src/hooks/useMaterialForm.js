import { useState } from "react";

export function useMaterialForm(
  fetchMaterials,
  currentPage,
  searchTerm,
  selectedCategory,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const createMaterial = async (materialData) => {
    if (!materialData.name.trim()) {
      setError("Material name is required");
      return false;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...materialData,
          unit_cost: parseFloat(materialData.unit_cost) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create material");
      }

      // Refresh materials list
      await fetchMaterials(currentPage, searchTerm, selectedCategory);
      return true;
    } catch (error) {
      console.error("Error creating material:", error);
      setError(error.message);
      return false;
    } finally {
      setCreating(false);
    }
  };

  const updateMaterial = async (materialData) => {
    if (!materialData.name.trim()) {
      setError("Material name is required");
      return false;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await fetch(`/api/materials/${materialData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...materialData,
          unit_cost: parseFloat(materialData.unit_cost) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update material");
      }

      // Refresh materials list
      await fetchMaterials(currentPage, searchTerm, selectedCategory);
      return true;
    } catch (error) {
      console.error("Error updating material:", error);
      setError(error.message);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    creating,
    updating,
    error,
    setError,
    createMaterial,
    updateMaterial,
  };
}
