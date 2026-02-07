import { useState } from "react";

export function usePaymentForm() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const resetPaymentForm = () => {
    setSelectedInvoice(null);
    setPaymentAmount("");
    setPaymentRef("");
    setPaymentNotes("");
  };

  const initializePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balance_due);
  };

  return {
    selectedInvoice,
    paymentAmount,
    paymentMethod,
    paymentRef,
    paymentNotes,
    setPaymentAmount,
    setPaymentMethod,
    setPaymentRef,
    setPaymentNotes,
    resetPaymentForm,
    initializePayment,
  };
}
