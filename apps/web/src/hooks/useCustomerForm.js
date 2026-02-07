import { useState } from "react";

const initialCustomerState = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
};

export function useCustomerForm(onSuccess) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState(initialCustomerState);
  const [error, setError] = useState("");

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.company_name.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create customer");
      }

      // Reset form and close modal
      setNewCustomer(initialCustomerState);
      setShowCreateModal(false);

      // Call success callback
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setError("");
    setNewCustomer(initialCustomerState);
  };

  return {
    showCreateModal,
    setShowCreateModal,
    creating,
    newCustomer,
    setNewCustomer,
    error,
    setError,
    handleCreateCustomer,
    resetForm,
  };
}
