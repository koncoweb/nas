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

export const getStatusBadge = (status) => {
  const styles = {
    draft: "bg-neutral-100 text-neutral-700",
    sent: "bg-primary-100 text-primary-700",
    approved: "bg-accent-100 text-accent-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-accent-100 text-accent-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.draft} print:hidden`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Draft"}
    </span>
  );
};
