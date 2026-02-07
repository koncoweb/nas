import { useState } from "react";

export function useMaterialRequestActions(requestId, setMaterialRequest) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleAction = async (action, comments = "", approve = null) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const body = { action };

      if (action === "review") {
        body.approve = approve;
        body.comments = comments;
      } else if (action === "direct_approve") {
        // Direct approve action - bypasses normal workflow
        body.action = "direct_approve";
      } else if (comments) {
        body.comments = comments;
      }

      const response = await fetch(`/api/material-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} request`);
      }

      const data = await response.json();
      setMaterialRequest(data.material_request);

      if (action === "direct_approve") {
        setActionSuccess("Request approved directly!");
      } else {
        setActionSuccess(`Request ${action}ed successfully!`);
      }

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(`Error ${action} request:`, err);
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return { actionLoading, actionError, actionSuccess, handleAction };
}
