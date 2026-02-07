import { useState } from "react";

export function useQuotationForm() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [formData, setFormData] = useState({
    customer_id: "",
    title: "",
    description: "",
    service_type: "",
    vessel_name: "",
    location: "",
    revision_number: 0,
    labor_hours: 0,
    labor_rate: 0,
    profit_margin: 15,
    time_estimation_supply: "",
    time_estimation_work: "",
    payment_percentage: 100,
    payment_timing: "Upon work completion",
    validity_days: 7,
    other_terms:
      "PT. Nata Air Sagara Terms and Condition of Sales shall Applied",
    valid_until: "",
    notes: "",
    // NEW: currency selection for quotation totals/preview formatting
    currency: "IDR",
    // NEW: page-1 date (for display) and page-2 notes under items
    issue_date: todayStr,
    scope_note: "",
    // NEW: exclusions controls
    exclusions: [],
    exclusions_other: "",
  });

  // LEGACY flat items (kept for backward compatibility in edit forms)
  const [lineItems, setLineItems] = useState([
    {
      description: "",
      quantity: 1,
      unit_type: "Unit",
      unit_price: 0,
      item_type: "material",
      material_id: null,
      // NEW: optional grouping label for backward compatible flows
      scope_group: null,
    },
  ]);

  // LEGACY scopeWork (deprecated in new hierarchy) - kept for older records
  const [scopeWork, setScopeWork] = useState([
    { description: "", work_category: "", estimated_hours: 0 },
  ]);

  // NEW hierarchical groups: [{ title, items: [...] }]
  const [scopeGroups, setScopeGroups] = useState([
    {
      title: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_type: "Unit",
          unit_price: 0,
          item_type: "material",
          material_id: null,
        },
      ],
    },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (index, field, value, materials = []) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If material is selected, auto-fill fields
    if (field === "material_id" && value) {
      const material = materials.find((m) => m.id == value);
      if (material) {
        newItems[index].description = material.name;
        newItems[index].unit_price = material.unit_cost;
        newItems[index].unit_type = material.unit_type;
      }
    }

    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: "",
        quantity: 1,
        unit_type: "Unit",
        unit_price: 0,
        item_type: "material",
        material_id: null,
        scope_group: null,
      },
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleScopeWorkChange = (index, field, value) => {
    const newScope = [...scopeWork];
    newScope[index] = { ...newScope[index], [field]: value };
    setScopeWork(newScope);
  };

  const addScopeWork = () => {
    setScopeWork([
      ...scopeWork,
      { description: "", work_category: "", estimated_hours: 0 },
    ]);
  };

  const removeScopeWork = (index) => {
    setScopeWork(scopeWork.filter((_, i) => i !== index));
  };

  // Handlers for hierarchical groups
  const addGroup = () => {
    setScopeGroups((prev) => [
      ...prev,
      {
        title: "",
        items: [
          {
            description: "",
            quantity: 1,
            unit_type: "Unit",
            unit_price: 0,
            item_type: "material",
            material_id: null,
          },
        ],
      },
    ]);
  };

  const removeGroup = (gIdx) => {
    setScopeGroups((prev) => prev.filter((_, i) => i !== gIdx));
  };

  const changeGroupTitle = (gIdx, title) => {
    setScopeGroups((prev) =>
      prev.map((g, i) => (i === gIdx ? { ...g, title } : g)),
    );
  };

  const addGroupItem = (gIdx) => {
    setScopeGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx
          ? {
              ...g,
              items: [
                ...g.items,
                {
                  description: "",
                  quantity: 1,
                  unit_type: "Unit",
                  unit_price: 0,
                  item_type: "material",
                  material_id: null,
                },
              ],
            }
          : g,
      ),
    );
  };

  const removeGroupItem = (gIdx, iIdx) => {
    setScopeGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx ? { ...g, items: g.items.filter((_, j) => j !== iIdx) } : g,
      ),
    );
  };

  const changeGroupItem = (gIdx, iIdx, field, value) => {
    setScopeGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx
          ? {
              ...g,
              items: g.items.map((it, j) =>
                j === iIdx ? { ...it, [field]: value } : it,
              ),
            }
          : g,
      ),
    );
  };

  // Utility to flatten groups into line items (with scope_group set)
  const flattenGroupsToItems = () => {
    const items = [];
    scopeGroups.forEach((g) => {
      const title = (g.title || "").trim();
      (g.items || []).forEach((it) => {
        items.push({
          description: it.description || "",
          quantity: it.quantity || 0,
          unit_type: it.unit_type || "Unit",
          unit_price: it.unit_price || 0,
          item_type: it.item_type || "material",
          material_id: it.material_id || null,
          scope_group: title || null,
        });
      });
    });
    return items;
  };

  // Utility to derive scope_work rows from groups
  const groupsToScopeWork = () => {
    return scopeGroups
      .map((g) => ({
        description: (g.title || "").trim() || "",
        work_category: null,
        estimated_hours: 0,
      }))
      .filter((g) => g.description);
  };

  return {
    formData,
    lineItems,
    scopeWork,
    scopeGroups,
    handleInputChange,
    handleLineItemChange,
    addLineItem,
    removeLineItem,
    handleScopeWorkChange,
    addScopeWork,
    removeScopeWork,
    // groups api
    addGroup,
    removeGroup,
    changeGroupTitle,
    addGroupItem,
    removeGroupItem,
    changeGroupItem,
    // utils
    flattenGroupsToItems,
    groupsToScopeWork,
    setFormData,
    setLineItems,
    setScopeWork,
    setScopeGroups,
  };
}
