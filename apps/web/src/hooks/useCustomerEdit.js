import { useState } from "react";

export function useCustomerEdit(onSuccess) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editCustomer, setEditCustomer] = useState(null);

  const openEditModal = (customer) => {
    setEditCustomer({ ...customer });
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editCustomer?.company_name?.trim()) {
      setEditError("Company name is required");
      return;
    }

    try {
      setEditing(true);
      setEditError("");

      const { id, created_at, ...payload } = editCustomer;
      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Failed to update customer";
        try {
          const errJson = await response.json();
          message = errJson.error || message;
        } catch (_) {}
        throw new Error(message);
      }

      setShowEditModal(false);

      // Call success callback
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      console.error("Error updating customer:", err);
      setEditError(err.message);
    } finally {
      setEditing(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditError("");
    setEditCustomer(null);
  };

  return {
    showEditModal,
    editing,
    editError,
    editCustomer,
    setEditCustomer,
    openEditModal,
    handleUpdateCustomer,
    closeEditModal,
  };
}
