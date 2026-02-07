export const statusOptions = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-accent-100 text-yellow-800",
  },
  {
    value: "customer_signed",
    label: "Customer Signed",
    color: "bg-primary-100 text-primary-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-accent-100 text-accent-800",
  },
];

export const reportTypeOptions = [
  { value: "work_done", label: "Work Done Report" },
  { value: "delivery_order", label: "Delivery Order" },
];

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

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};

export const getInitialReportData = () => ({
  project_id: "",
  report_type: "work_done", // new: type of report
  completion_date: new Date().toISOString().split("T")[0],
  work_summary: "",
  materials_used: "",
  recommendations: "",
  customer_feedback: "",
  issues_encountered: "",
  // Delivery Order fields
  delivery_number: "",
  delivered_date: "",
  delivery_items: "",
  delivery_notes: "",
});

export const getInitialEditReportData = () => ({
  id: "",
  project_id: "",
  report_type: "work_done",
  completion_date: "",
  work_summary: "",
  materials_used: "",
  recommendations: "",
  customer_feedback: "",
  issues_encountered: "",
  // Delivery Order fields
  delivery_number: "",
  delivered_date: "",
  delivery_items: "",
  delivery_notes: "",
  status: "pending",
});

export const canManageReports = (userRole) => {
  return (
    userRole === "leader" || userRole === "engineer" || userRole === "sales"
  );
};
