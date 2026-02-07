"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useUser from "@/utils/useUser";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMaterialRequestDetail } from "@/hooks/useMaterialRequestDetail";
import { useMaterialRequestActions } from "@/hooks/useMaterialRequestActions";
import { BreadcrumbHeader } from "@/components/MaterialRequestDetail/BreadcrumbHeader";
import { LoadingState } from "@/components/MaterialRequestDetail/LoadingState";
import { ErrorState } from "@/components/MaterialRequestDetail/ErrorState";
import { PageHeader } from "@/components/MaterialRequestDetail/PageHeader";
import { AlertMessages } from "@/components/MaterialRequestDetail/AlertMessages";
import { RequestInformation } from "@/components/MaterialRequestDetail/RequestInformation";
import { ItemsTable } from "@/components/MaterialRequestDetail/ItemsTable";
import { ApprovalWorkflow } from "@/components/MaterialRequestDetail/ApprovalWorkflow";
import { ActionsSidebar } from "@/components/MaterialRequestDetail/ActionsSidebar";
import { EditItemModal } from "@/components/MaterialRequestDetail/EditItemModal";

export default function MaterialRequestDetailPage({ params }) {
  const requestId = params.id;

  const { data: user, loading: userLoading } = useUser();
  const userProfile = useUserProfile(user);
  const { materialRequest, loading, error, setMaterialRequest } =
    useMaterialRequestDetail(requestId, userProfile);
  const { actionLoading, actionError, actionSuccess, handleAction } =
    useMaterialRequestActions(requestId, setMaterialRequest);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [materials, setMaterials] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Preview modal state for print preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrl = `/api/material-requests/${parseInt(requestId, 10) || requestId}/pdf`;
  const iframeRef = useRef(null);

  // Load materials for dropdown
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch("/api/materials");
        if (response.ok) {
          const data = await response.json();
          setMaterials(data.materials || []);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    if (userProfile) {
      fetchMaterials();
    }
  }, [userProfile]);

  // Handle edit item
  const handleEditItem = (item, index) => {
    setEditingItem(item);
    setEditingIndex(index);
    setEditModalOpen(true);
  };

  // Handle delete item
  const handleDeleteItem = async (item, index) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await fetch(`/api/material-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_item",
          item_index: index,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      const data = await response.json();
      setMaterialRequest(data.material_request);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  // Handle save item
  const handleSaveItem = async (itemData, index) => {
    setEditLoading(true);
    try {
      const response = await fetch(`/api/material-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_item",
          item_data: itemData,
          item_index: index,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save item");
      }

      const data = await response.json();
      setMaterialRequest(data.material_request);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error saving item:", error);
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  const handlePrint = useCallback(() => {
    const node = iframeRef.current;
    if (node && node.contentWindow) {
      node.contentWindow.focus();
      node.contentWindow.print();
      return;
    }
    window.open(previewUrl, "_blank");
  }, [previewUrl]);

  const handleExportPDF = useCallback(() => {
    // Open PDF view; users can Save as PDF
    window.open(previewUrl, "_blank");
  }, [previewUrl]);

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

  if (loading) {
    return <LoadingState userProfile={userProfile} userRole={userRole} />;
  }

  if (error || !materialRequest) {
    return (
      <ErrorState userProfile={userProfile} userRole={userRole} error={error} />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <BreadcrumbHeader
        userProfile={userProfile}
        userRole={userRole}
        requestId={requestId}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader materialRequest={materialRequest} requestId={requestId} />

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-neutral-800 text-white text-sm hover:bg-neutral-900"
          >
            Preview
          </button>
        </div>

        <AlertMessages
          actionSuccess={actionSuccess}
          actionError={actionError}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <RequestInformation materialRequest={materialRequest} />
            <ItemsTable
              materialRequest={materialRequest}
              userRole={userRole}
              requestId={requestId}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
            <ApprovalWorkflow
              approvalWorkflow={materialRequest.approval_workflow}
            />
          </div>

          {/* Sidebar */}
          <ActionsSidebar
            userRole={userRole}
            materialRequest={materialRequest}
            requestId={requestId}
            actionLoading={actionLoading}
            handleAction={handleAction}
          />
        </div>
      </div>

      {/* Edit Item Modal */}
      {editModalOpen && (
        <EditItemModal
          item={editingItem}
          index={editingIndex}
          materials={materials}
          onSave={handleSaveItem}
          onClose={() => {
            setEditModalOpen(false);
            setEditingItem(null);
            setEditingIndex(-1);
          }}
        />
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col"
            style={{
              height: "95vh",
              width: "min(100%, calc(95vh * 0.707))", // keep A4 ratio
            }}
          >
            <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b">
              <h3 className="text-sm font-semibold text-neutral-900">
                Preview Material Request
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe
                ref={iframeRef}
                title="MR Preview"
                src={previewUrl}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
