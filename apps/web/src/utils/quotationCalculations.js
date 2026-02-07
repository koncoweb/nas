export function calculateQuotationTotals(lineItems, formData) {
  const materialsTotal = lineItems.reduce(
    (sum, item) =>
      sum + parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0),
    0,
  );
  const laborCost =
    parseFloat(formData.labor_hours || 0) *
    parseFloat(formData.labor_rate || 0);
  const subtotal = materialsTotal + laborCost;
  const profit = subtotal * (parseFloat(formData.profit_margin || 0) / 100);
  const total = subtotal + profit;

  return {
    materialsTotal,
    laborCost,
    subtotal,
    profit,
    total,
  };
}
