"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import MaterialRequestPreview from "@/components/MaterialRequestForm/MaterialRequestPreview";

export default function NewMaterialRequestPage() {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    project_id: "",
    request_type: "material",
    title: "",
    description: "",
    urgency: "medium",
    needed_date: "",
  });

  // Line items
  const [items, setItems] = useState([
    {
      material_id: "",
      description: "",
      quantity: 1,
      unit_type: "Unit",
      estimated_unit_cost: 0,
      purpose: "",
      is_urgent: false,
    },
  ]);

  // Fetch user profile
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
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch projects and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userProfile) return;

        // Fetch projects
        const projectsResponse = await fetch("/api/projects?limit=100");
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        }

        // Fetch materials
        const materialsResponse = await fetch("/api/materials?limit=100");
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setMaterials(materialsData.materials || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // If material is selected, auto-fill description and unit cost
    if (field === "material_id" && value) {
      const material = materials.find((m) => m.id === parseInt(value));
      if (material) {
        newItems[index].description = material.name;
        newItems[index].unit_type = material.unit_type || "Unit";
        newItems[index].estimated_unit_cost = parseFloat(
          material.unit_cost || 0,
        );
      }
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        material_id: "",
        description: "",
        quantity: 1,
        unit_type: "Unit",
        estimated_unit_cost: 0,
        purpose: "",
        is_urgent: false,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return (
        total +
        parseFloat(item.quantity || 0) *
          parseFloat(item.estimated_unit_cost || 0)
      );
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/material-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create material request");
      }

      const data = await response.json();
      setSuccess("Material request created successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = `/material-requests/${data.material_request.id}`;
      }, 1500);
    } catch (err) {
      console.error("Error creating material request:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (userLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = userProfile?.user_role || "engineer";

  // Engineers, sales, and leaders can create material requests
  if (
    userRole !== "engineer" &&
    userRole !== "sales" &&
    userRole !== "leader"
  ) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Access Denied
          </h2>
          <p className="text-neutral-600 mb-4">
            You don't have permission to create material requests.
          </p>
          <a
            href="/material-requests"
            className="text-primary-600 hover:text-primary-700"
          >
            Go Back
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
                {userProfile?.name || userProfile?.email}
              </span>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                {userRole}
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
          <a
            href="/material-requests"
            className="flex items-center text-neutral-600 hover:text-neutral-900 mb-4"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Material Requests
          </a>
          <h2 className="text-2xl font-bold text-neutral-900">
            New Material Request
          </h2>
          <p className="text-neutral-600 mt-1">
            Request materials or operational costs for your project
          </p>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="w-5 h-5 text-green-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-accent-700">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.project_id}
                      onChange={(e) =>
                        handleInputChange("project_id", e.target.value)
                      }
                      className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                      style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_number} - {project.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Request Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.request_type}
                      onChange={(e) =>
                        handleInputChange("request_type", e.target.value)
                      }
                      className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                      style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                    >
                      <option value="material">Material</option>
                      <option value="operational_cost">Operational Cost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="e.g., HVAC Parts for Installation"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Provide additional details about this request..."
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Urgency
                      </label>
                      <select
                        value={formData.urgency}
                        onChange={(e) =>
                          handleInputChange("urgency", e.target.value)
                        }
                        className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                        style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Needed By Date
                      </label>
                      <input
                        type="date"
                        value={formData.needed_date}
                        onChange={(e) =>
                          handleInputChange("needed_date", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
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
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-neutral-700">
                          Item {index + 1}
                        </h4>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Material (Optional)
                          </label>
                          <select
                            value={item.material_id}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "material_id",
                                e.target.value,
                              )
                            }
                            className="dropdown-fix w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
                            style={{ color: '#111827 !important', backgroundColor: '#ffffff !important' }}
                          >
                            <option value="">
                              Select from catalog (optional)
                            </option>
                            {materials.map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.name} -{" "}
                                {formatCurrency(material.unit_cost)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Item description"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Unit Type
                            </label>
                            <input
                              type="text"
                              value={item.unit_type}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unit_type",
                                  e.target.value,
                                )
                              }
                              placeholder="Unit"
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Est. Unit Cost
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.estimated_unit_cost}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "estimated_unit_cost",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Purpose
                          </label>
                          <input
                            type="text"
                            value={item.purpose}
                            onChange={(e) =>
                              handleItemChange(index, "purpose", e.target.value)
                            }
                            placeholder="What is this item for?"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`urgent-${index}`}
                            checked={item.is_urgent}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "is_urgent",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                          />
                          <label
                            htmlFor={`urgent-${index}`}
                            className="ml-2 text-sm text-neutral-700"
                          >
                            Mark as urgent
                          </label>
                        </div>

                        <div className="pt-2 border-t border-neutral-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Item Total:</span>
                            <span className="font-medium text-neutral-900">
                              {formatCurrency(
                                parseFloat(item.quantity || 0) *
                                  parseFloat(item.estimated_unit_cost || 0),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary + Preview trigger Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Request Summary
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Total Items:</span>
                    <span className="font-medium text-neutral-900">
                      {items.length}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Total Quantity:</span>
                    <span className="font-medium text-neutral-900">
                      {items.reduce(
                        (sum, item) => sum + parseFloat(item.quantity || 0),
                        0,
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-neutral-900">
                        Estimated Total:
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Request"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg hover:bg-neutral-900 transition-colors font-medium"
                  >
                    Preview
                  </button>

                  <a
                    href="/material-requests"
                    className="block w-full text-center bg-white text-neutral-700 px-4 py-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors font-medium"
                  >
                    Cancel
                  </a>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    <strong>Note:</strong> This request will be saved as a
                    draft. You can submit it for approval after reviewing the
                    details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-base font-semibold text-neutral-900">
                Preview Material Request
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <MaterialRequestPreview
                formData={formData}
                items={items}
                projects={projects}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
