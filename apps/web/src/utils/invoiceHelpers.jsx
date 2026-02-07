export const statusOptions = [
  { value: "draft", label: "Draft", color: "bg-neutral-100 text-neutral-800" },
  { value: "sent", label: "Sent", color: "bg-primary-100 text-primary-800" },
  {
    value: "partial",
    label: "Partial Payment",
    color: "bg-accent-100 text-yellow-800",
  },
  { value: "paid", label: "Paid", color: "bg-accent-100 text-accent-800" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-neutral-100 text-neutral-800",
  },
];

export const paymentTermsOptions = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
];

export const paymentMethods = [
  "check",
  "credit_card",
  "bank_transfer",
  "cash",
  "other",
];

export const calculateTotals = (lineItems, taxRate) => {
  const subtotal = lineItems.reduce((sum, item) => {
    return (
      sum + parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)
    );
  }, 0);
  const taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
};

// UPDATED: Support IDR, SGD, USD with preferred symbols
export const formatCurrency = (amount, currency = "IDR") => {
  const n = parseFloat(amount || 0);
  if (currency === "USD") {
    return `US$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "SGD") {
    return `S$ ${n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // default IDR no cents
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};

export const isOverdue = (invoice) => {
  if (invoice.status === "paid" || invoice.status === "cancelled") return false;
  if (!invoice.due_date) return false;
  return (
    new Date(invoice.due_date) < new Date() &&
    parseFloat(invoice.balance_due || 0) > 0
  );
};

export const getStatusBadge = (status) => {
  const statusConfig =
    statusOptions.find((s) => s.value === status) || statusOptions[0];
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
    >
      {statusConfig.label}
    </span>
  );
};
