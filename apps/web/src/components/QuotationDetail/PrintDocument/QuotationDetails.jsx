export function QuotationDetails({
  quotation,
  showPricing,
  formatCurrency,
  companySettings,
}) {
  const primary =
    (companySettings && companySettings.primary_color) || "#0F4C81";

  return (
    <div className="page page-3" style={{ pageBreakBefore: "always" }}>
      {/* Letterhead to match export PDF on every page */}
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
        <div className="page-title">QUOTATION DETAILS</div>
        <div className="page-ref">Ref: {quotation.quote_number}</div>
      </div>

      {showPricing && (
        <div className="totals-section">
          <div className="total-line">
            <strong>TOTAL: {formatCurrency(quotation.final_price)}</strong>
          </div>
        </div>
      )}

      <div className="exclusions-section">
        <div className="section-title">EXCLUSIONS</div>
        <div className="numbered-list">
          <div className="list-item">
            1. Electrical power supply and cabling from main panel to equipment
            location
          </div>
          <div className="list-item">
            2. Structural modifications if required
          </div>
          <div className="list-item">3. Permit and license fees</div>
          <div className="list-item">
            4. Any unforeseen works not mentioned in this quotation
          </div>
        </div>
      </div>

      <div className="terms-section">
        <div className="section-title">TERMS AND CONDITIONS</div>

        <div className="terms-content">
          <div className="term-item">
            <div className="term-number">1.0 VALIDITY</div>
            <div className="term-text">
              This quotation is valid for {quotation.validity_days || 7} days
              from date of issuance.
            </div>
          </div>

          {quotation.time_estimation_supply && (
            <div className="term-item">
              <div className="term-number">2.0 TIME ESTIMATION SUPPLY</div>
              <div className="term-text">
                {quotation.time_estimation_supply}
              </div>
            </div>
          )}

          {quotation.time_estimation_work && (
            <div className="term-item">
              <div className="term-number">3.0 TIME ESTIMATION WORK</div>
              <div className="term-text">{quotation.time_estimation_work}</div>
            </div>
          )}

          {showPricing && (
            <div className="term-item">
              <div className="term-number">4.0 PAYMENT TERMS</div>
              <div className="term-text">
                {quotation.payment_percentage}% {quotation.payment_timing}
              </div>
            </div>
          )}

          <div className="term-item">
            <div className="term-number">5.0 WARRANTY</div>
            <div className="term-text">
              12 months warranty for equipment and 6 months warranty for
              installation workmanship
            </div>
          </div>

          {quotation.other_terms && (
            <div className="term-item">
              <div className="term-number">6.0 ADDITIONAL TERMS</div>
              <div className="term-text">{quotation.other_terms}</div>
            </div>
          )}
        </div>
      </div>

      {quotation.notes && (
        <div className="notes-section">
          <div className="section-title">REMARKS</div>
          <div className="notes-content" style={{ whiteSpace: "pre-wrap" }}>
            {quotation.notes}
          </div>
        </div>
      )}
    </div>
  );
}
