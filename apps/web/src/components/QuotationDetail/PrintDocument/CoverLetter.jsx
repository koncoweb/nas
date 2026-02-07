export function CoverLetter({ quotation, companySettings, formatDate }) {
  return (
    <div className="page page-1">
      {/* Company Letterhead */}
      <div className="letterhead">
        <div className="company-header">
          {companySettings.logo_url && (
            <div className="company-logo">
              <img src={companySettings.logo_url} alt="Company Logo" />
            </div>
          )}
          <div className="company-info">
            <h1 className="company-name">{companySettings.company_name}</h1>
            <h2 className="company-tagline">
              ({companySettings.company_tagline})
            </h2>
            <div className="company-address">
              <div>{companySettings.address_line1}</div>
              <div>{companySettings.address_line2}</div>
              <div>{companySettings.address_line3}</div>
              <div>
                {companySettings.phone} - {companySettings.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Information */}
      <div className="reference-section">
        <div className="ref-left">
          <div className="ref-title">QUOTATION</div>
          <div className="ref-details">
            <div>
              <strong>Ref</strong> : {quotation.quote_number}
            </div>
            <div>
              <strong>Date</strong> : {formatDate(quotation.created_at)}
            </div>
            <div>
              <strong>Vessel</strong> : {quotation.vessel_name || "-"}
            </div>
            <div>
              <strong>Location</strong> : {quotation.location || "-"}
            </div>
            <div>
              <strong>Revision</strong> : {quotation.revision_number}
            </div>
          </div>
        </div>
        <div className="ref-right">
          <div className="customer-title">CUSTOMER</div>
          <div className="customer-details">
            <div className="customer-name">{quotation.company_name}</div>
            {quotation.contact_name && (
              <div>Attn: {quotation.contact_name}</div>
            )}
            {quotation.email && <div>{quotation.email}</div>}
            {quotation.phone && <div>{quotation.phone}</div>}
          </div>
        </div>
      </div>

      {/* ADD: Service Title */}
      {quotation.title && (
        <div className="service-title-block" style={{ marginTop: 12 }}>
          <div className="section-title">SERVICE TITLE</div>
          <div>
            <strong>{quotation.title}</strong>
          </div>
        </div>
      )}

      {/* Introduction Letter */}
      <div className="introduction">
        <div className="greeting">
          Dear{" "}
          {quotation.contact_name
            ? quotation.contact_name.split(" ")[0]
            : "Sir/Madam"}
          ,
        </div>

        <div className="intro-text">
          <p>
            We are pleased to submit our competitive quotation for{" "}
            <strong>{quotation.title}</strong>
            as requested. We trust that our proposal will meet your requirements
            and look forward to the opportunity to serve you.
          </p>

          {quotation.description && (
            <div className="service-description">
              <div style={{ whiteSpace: "pre-wrap" }}>
                {quotation.description}
              </div>
            </div>
          )}
        </div>

        <div className="closing">
          <p>
            Should you require any clarification or additional information,
            please do not hesitate to contact us.
          </p>
          <br />
          <p>Thank you for your kind consideration.</p>
        </div>
      </div>

      {/* Signature Block */}
      <div className="signature-block">
        <div className="signature-left">
          <div>Yours faithfully,</div>
          <br />
          <br />
          <div className="signature-line"></div>
          <div>
            <strong>{companySettings.director_name}</strong>
          </div>
          <div>{companySettings.director_title}</div>
          <div>Email: {companySettings.director_email}</div>
          <div>Mobile: {companySettings.director_phone}</div>
          <div>DID: {companySettings.director_did}</div>
        </div>
        <div className="signature-right">
          {companySettings.logo_url && (
            <img
              src={companySettings.logo_url}
              alt="Company Seal"
              className="company-seal"
            />
          )}
        </div>
      </div>
    </div>
  );
}
