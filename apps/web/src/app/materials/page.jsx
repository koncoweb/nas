"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialForm } from "@/hooks/useMaterialForm";
import { Header } from "@/components/Materials/Header";
import { PageHeader } from "@/components/Materials/PageHeader";
import { SearchFilters } from "@/components/Materials/SearchFilters";
import { MaterialsTable } from "@/components/Materials/MaterialsTable";
import { Pagination } from "@/components/Materials/Pagination";
import { EmptyState } from "@/components/Materials/EmptyState";
import { LoadingState } from "@/components/Materials/LoadingState";
import { MaterialFormModal } from "@/components/Materials/MaterialFormModal";
import { unitTypes, commonCategories } from "@/utils/materialConstants";

export default function MaterialsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    description: "",
    category: "",
    unit_type: "Unit",
    unit_cost: "",
    supplier: "",
    part_number: "",
  });
  const [editMaterial, setEditMaterial] = useState({
    id: "",
    name: "",
    description: "",
    category: "",
    unit_type: "Unit",
    unit_cost: "",
    supplier: "",
    part_number: "",
  });

  const {
    materials,
    loading,
    error,
    categories,
    pagination,
    fetchMaterials,
    setError,
  } = useMaterials(user, currentPage, searchTerm, selectedCategory);

  const {
    creating,
    updating,
    error: formError,
    setError: setFormError,
    createMaterial,
    updateMaterial,
  } = useMaterialForm(
    fetchMaterials,
    currentPage,
    searchTerm,
    selectedCategory,
  );

  // Fetch user profile to get role
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.user_role || "sales");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchMaterials(1, searchTerm, selectedCategory);
  };

  // Handle category filter
  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    await fetchMaterials(1, searchTerm, category);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setCurrentPage(1);
    fetchMaterials(1, "", "");
  };

  // Handle create material
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    const success = await createMaterial(newMaterial);
    if (success) {
      setNewMaterial({
        name: "",
        description: "",
        category: "",
        unit_type: "Unit",
        unit_cost: "",
        supplier: "",
        part_number: "",
      });
      setShowCreateModal(false);
    }
  };

  // Handle update material
  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    const success = await updateMaterial(editMaterial);
    if (success) {
      setShowEditModal(false);
    }
  };

  // Handle edit modal open
  const openEditModal = (material) => {
    setEditMaterial({
      id: material.id,
      name: material.name,
      description: material.description || "",
      category: material.category || "",
      unit_type: material.unit_type || "Unit",
      unit_cost: material.unit_cost?.toString() || "",
      supplier: material.supplier || "",
      part_number: material.part_number || "",
    });
    setShowEditModal(true);
    setFormError("");
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Loading state
  if (userLoading || (loading && materials.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading materials...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Please sign in to view materials</p>
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

  const canManageMaterials =
    userRole === "leader" || userRole === "engineer" || userRole === "sales";

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          canManageMaterials={canManageMaterials}
          onAddMaterial={() => setShowCreateModal(true)}
        />

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          onClear={handleClearFilters}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Materials Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : materials.length === 0 ? (
            <EmptyState
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              canManageMaterials={canManageMaterials}
              onAddMaterial={() => setShowCreateModal(true)}
            />
          ) : (
            <>
              <MaterialsTable
                materials={materials}
                canManageMaterials={canManageMaterials}
                onEdit={openEditModal}
              />
              <Pagination
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Create Material Modal */}
      <MaterialFormModal
        isOpen={showCreateModal}
        isEdit={false}
        material={newMaterial}
        onMaterialChange={setNewMaterial}
        onSubmit={handleCreateMaterial}
        onClose={() => {
          setShowCreateModal(false);
          setFormError("");
          setNewMaterial({
            name: "",
            description: "",
            category: "",
            unit_type: "Unit",
            unit_cost: "",
            supplier: "",
            part_number: "",
          });
        }}
        submitting={creating}
        error={formError}
        unitTypes={unitTypes}
        commonCategories={commonCategories}
      />

      {/* Edit Material Modal */}
      <MaterialFormModal
        isOpen={showEditModal}
        isEdit={true}
        material={editMaterial}
        onMaterialChange={setEditMaterial}
        onSubmit={handleUpdateMaterial}
        onClose={() => {
          setShowEditModal(false);
          setFormError("");
        }}
        submitting={updating}
        error={formError}
        unitTypes={unitTypes}
        commonCategories={commonCategories}
      />
    </div>
  );
}
