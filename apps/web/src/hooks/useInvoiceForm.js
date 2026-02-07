import { useState } from "react";

export function useInvoiceForm() {
  const [newInvoice, setNewInvoice] = useState({
    project_id: "",
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_terms: "Net 30",
    subtotal: 0,
    tax_rate: 8.25,
    notes: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0 }],
    // NEW: currency selection for invoice amount displays
    currency: "IDR",
  });

  const updateLineItem = (index, field, value) => {
    const updatedItems = [...newInvoice.line_items];
    updatedItems[index][field] = value;
    setNewInvoice({ ...newInvoice, line_items: updatedItems });
  };

  const addLineItem = () => {
    setNewInvoice({
      ...newInvoice,
      line_items: [
        ...newInvoice.line_items,
        { description: "", quantity: 1, unit_price: 0 },
      ],
    });
  };

  const removeLineItem = (index) => {
    if (newInvoice.line_items.length > 1) {
      const updatedItems = newInvoice.line_items.filter((_, i) => i !== index);
      setNewInvoice({ ...newInvoice, line_items: updatedItems });
    }
  };

  const resetForm = () => {
    setNewInvoice({
      project_id: "",
      customer_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: "",
      payment_terms: "Net 30",
      subtotal: 0,
      tax_rate: 8.25,
      notes: "",
      line_items: [{ description: "", quantity: 1, unit_price: 0 }],
      currency: "IDR",
    });
  };

  return {
    newInvoice,
    setNewInvoice,
    updateLineItem,
    addLineItem,
    removeLineItem,
    resetForm,
  };
}
