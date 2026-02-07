export const getStatusColor = (status) => {
  switch (status) {
    case "draft":
      return "bg-neutral-100 text-neutral-800";
    case "submitted":
      return "bg-primary-100 text-primary-800";
    case "under_review":
      return "bg-accent-100 text-yellow-800";
    case "approved":
      return "bg-accent-100 text-accent-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-neutral-100 text-neutral-600";
    default:
      return "bg-neutral-100 text-neutral-800";
  }
};

export const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case "low":
      return "bg-accent-50 text-accent-700 border-accent-200";
    case "medium":
      return "bg-accent-50 text-accent-700 border-accent-200";
    case "high":
      return "bg-accent-50 text-accent-700 border-accent-200";
    case "urgent":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-neutral-50 text-neutral-700 border-neutral-200";
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getStatusText = (status) => {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status?.charAt(0)?.toUpperCase() + status?.slice(1) || "Unknown";
  }
};
