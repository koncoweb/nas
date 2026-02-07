"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import ReportPreview from "@/components/Reports/ReportPreview";

export default function NewDeliveryOrderPage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();

  // Fetch projects (react-query)
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", { limit: 1000 }],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=1000");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/projects, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    enabled: !!user && !userLoading,
  });

  const projects = projectsData?.projects || [];

  // Delivery Order form state
  const [projectId, setProjectId] = useState("");
  const [deliveredDate, setDeliveredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState([{ description: "", qty: "", unit: "" }]);
  const [error, setError] = useState("");
  // ADD: preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Build delivery_items text for preview + submit
  const deliveryItemsText = useMemo(() => {
    // We will serialize as a simple table-like text; backend stores text.
    const lines = rows
      .filter((r) => r.description || r.qty || r.unit)
      .map((r, idx) => {
        const no = idx + 1;
        const qty =
          r.qty !== undefined && r.qty !== null && r.qty !== "" ? r.qty : "-";
        const unit = r.unit?.trim() || "-";
        const desc = (r.description || "").trim();
        return `${no}. ${desc}  |  ${qty} ${unit}`;
      });
    return lines.join("\n");
  }, [rows]);

  // Structured items for preview table rendering (No, Description, Qty, Unit)
  const deliveryItemsTable = useMemo(() => {
    return rows
      .map((r, idx) => ({
        no: idx + 1,
        description: (r.description || "").trim(),
        qty: r.qty === 0 || r.qty ? String(r.qty) : "",
        unit: (r.unit || "").trim(),
      }))
      .filter((r) => r.description || r.qty || r.unit);
  }, [rows]);

  const isDOValid = useMemo(() => {
    if (!projectId) return false;
    if (!deliveredDate) return false;
    const hasAnyRow = rows.some((r) => (r.description || "").trim().length > 0);
    if (!hasAnyRow) return false;
    return true;
  }, [projectId, deliveredDate, rows]);

  const resetForm = useCallback(() => {
    setProjectId("");
    setDeliveredDate("");
    setNotes("");
    setRows([{ description: "", qty: "", unit: "" }]);
    setError("");
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        project_id: Number(projectId),
        report_type: "delivery_order",
        delivered_date: deliveredDate,
        delivery_items: deliveryItemsText,
        delivery_notes: notes || null,
      };
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error ||
            `When creating report, got [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      // Redirect to the created report page
      const id = data?.report?.id;
      if (id) {
        if (typeof window !== "undefined") {
          window.location.href = `/reports/${id}`;
        }
      } else {
        resetForm();
      }
    },
    onError: (e) => {
      setError(e?.message || "Failed to create report");
    },
  });

  // Handlers for row operations
  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { description: "", qty: "", unit: "" }]);
  }, []);

  const removeRow = useCallback((index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }, []);

  // Derived formData for preview component
  const previewFormData = useMemo(
    () => ({
      project_id: projectId,
      report_type: "delivery_order",
      delivered_date: deliveredDate,
      delivery_items: deliveryItemsText,
      // pass structured data for table rendering in preview
      delivery_items_table: deliveryItemsTable,
      delivery_notes: notes,
    }),
    [projectId, deliveredDate, deliveryItemsText, deliveryItemsTable, notes],
  );

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            New Delivery Order
          </h1>
          <p className="mt-2 text-neutral-600">
            Create a Delivery Order document with itemized table (No,
            Description, Qty, Unit)
          </p>
        </div>
        {/* ADD: Preview button */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="px-4 py-2 rounded-md text-white bg-neutral-800 hover:bg-neutral-900"
        >
          Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Delivery Order Form
          </h2>

          {/* Project */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Project
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 bg-white"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projectsLoading || !!projectsError}
            >
              <option value="">Select project…</option>
              {(projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} — {p.title}
                </option>
              ))}
            </select>
            {projectsError && (
              <p className="text-xs text-red-600 mt-1">
                Failed to load projects
              </p>
            )}
          </div>

          {/* Delivered Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Delivered Date
            </label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={deliveredDate}
              onChange={(e) => setDeliveredDate(e.target.value)}
            />
          </div>

          {/* Items (Quotation-like layout, but without price/total) */}
          <div className="mb-4 border rounded-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-neutral-900">Items</div>
                <div className="text-xs text-neutral-500">
                  Fill delivery items below
                </div>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="text-sm px-3 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700"
              >
                + Add Item
              </button>
            </div>

            {/* Header row */}
            <div className="px-4 pb-2">
              <div className="grid grid-cols-12 gap-3 text-xs font-medium text-neutral-600">
                <div className="col-span-1 text-center">No</div>
                <div className="col-span-7">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit</div>
              </div>
            </div>

            {/* Rows */}
            <div className="px-4 pb-4">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 items-start mb-3"
                >
                  <div className="col-span-1 flex items-center justify-center text-sm text-neutral-700">
                    {idx + 1}
                  </div>

                  <div className="col-span-7">
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the item/material"
                      value={row.description}
                      onChange={(e) =>
                        updateRow(idx, "description", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={row.qty}
                      min="0"
                      step="any"
                      onChange={(e) => updateRow(idx, "qty", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Unit"
                      value={row.unit}
                      onChange={(e) => updateRow(idx, "unit", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-red-600 hover:text-red-700 text-lg"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="text-sm text-neutral-500 py-6 text-center border rounded-md">
                  No items. Click "Add Item" to add.
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this delivery order"
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!isDOValid || createMutation.isLoading}
              className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {createMutation.isLoading ? "Saving…" : "Save Delivery Order"}
            </button>
            <a
              href="/reports"
              className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>

      {/* ADD: Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-base font-semibold text-neutral-900">
                Preview Delivery Order
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-2 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <ReportPreview formData={previewFormData} projects={projects} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
