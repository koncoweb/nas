export function MaterialsTable({
  quotation,
  showPricing,
  formatCurrency,
  companySettings,
}) {
  const items = quotation.line_items || [];
  if (!items.length) {
    return null;
  }

  const primary =
    (companySettings && companySettings.primary_color) || "#0F4C81";

  // group by scope_group (fallback to "General")
  const groups = items.reduce((acc, it) => {
    const key = (it.scope_group || "").trim() || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});
  const groupEntries = Object.entries(groups);

  return (
    <div className="page page-2" style={{ pageBreakBefore: "always" }}>
      {/* Letterhead on every printed page to match export PDF */}
      <div
        className="company-header"
        style={{ display: "flex", alignItems: "flex-start", gap: 20 }}
      >
        {companySettings?.logo_url && (
          <div className="company-logo">
            <img
              src={companySettings.logo_url}
              alt="Company Logo"
              style={{ maxWidth: 99, maxHeight: 88, objectFit: "contain" }}
            />
          </div>
        )}
        <div className="company-info" style={{ flex: 1, textAlign: "right" }}>
          <div
            className="company-address"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 9,
              lineHeight: 1.35,
              color: primary,
            }}
            dangerouslySetInnerHTML={{
              __html:
                [
                  companySettings?.address_line1,
                  companySettings?.address_line2,
                  companySettings?.address_line3,
                  companySettings?.phone,
                  companySettings?.email,
                ]
                  .filter(Boolean)
                  .join("<br/>") || "",
            }}
          />
        </div>
      </div>
      <div
        className="rule"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          margin: "6px 0 12px 0",
        }}
      >
        <div
          className="line-thick"
          style={{ height: 5.1, background: primary }}
        />
        <div
          className="line-thin"
          style={{ height: 1.7, background: primary }}
        />
      </div>

      <div className="page-header">
        <div className="page-title">SCOPE OF WORK</div>
        <div className="page-ref">Ref: {quotation.quote_number}</div>
      </div>

      {groupEntries.map(([title, rows], gIdx) => (
        <div
          key={gIdx}
          className="materials-section"
          style={{ marginBottom: 16 }}
        >
          <div className="section-title" style={{ marginBottom: 8 }}>
            {title}
          </div>
          <table className="materials-table">
            <thead>
              <tr>
                <th className="col-no">NO</th>
                <th className="col-description">DESCRIPTION</th>
                <th className="col-qty">QTY</th>
                {showPricing && <th className="col-price">TOTAL PRICE</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr key={idx}>
                  <td className="col-no">{idx + 1}</td>
                  <td className="col-description">{item.description}</td>
                  <td className="col-qty">
                    {parseFloat(item.quantity || 0).toLocaleString("id-ID")}{" "}
                    {item.unit_type || "Unit"}
                  </td>
                  {showPricing && (
                    <td className="col-price">
                      {formatCurrency(
                        parseFloat(item.quantity || 0) *
                          parseFloat(item.unit_price || 0) || 0,
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
