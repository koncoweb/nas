export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4;
          margin: 0; /* match export PDF full-bleed and control margins manually */
          counter-increment: page;
        }
        
        body {
          background: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-family: 'Times New Roman', serif;
        }

        /* Fixed letterhead and footer to repeat on every printed page */
        .print-fixed-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 30mm; /* same as PDF */
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          z-index: 9999;
        }
        .print-fixed-header .hf-inner {
          display: flex; align-items: flex-start; gap: 20px;
          padding: 10mm 20mm 4mm 20mm; /* logo + address */
        }
        .print-fixed-header .company-logo img { max-width: 99px; max-height: 88px; object-fit: contain; }
        .print-fixed-header .company-info { flex: 1; text-align: right; padding-right: 20mm; }
        .print-fixed-header .company-address { font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 1.35; }
        .print-rule { display: flex; flex-direction: column; gap: 3px; margin: 0 20mm 6px 20mm; }
        .print-rule .line-thick { height: 5.1px; }
        .print-rule .line-thin { height: 1.7px; }

        .print-fixed-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 18mm; /* same as PDF */
          display: flex; flex-direction: column; justify-content: flex-start;
          z-index: 9999;
        }
        .print-fixed-footer .print-rule { margin: 0 20mm 6px 20mm; }
        .print-footer-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 20mm; }
        .print-footer-bar .footer-right::after { content: 'Page ' counter(page) ' of ' counter(pages); }

        /* Content area padding to avoid overlap with fixed header/footer */
        .print-content { padding: 0 20mm; padding-top: 30mm; padding-bottom: 18mm; }

        /* Simulate physical pages so breaks occur cleanly */
        .page { height: 297mm; width: 210mm; position: relative; page-break-after: always; }
        .page:last-child { page-break-after: auto; }

        .print\\:hidden { display: none !important; }
        .print\\:max-w-none { max-width: none !important; }
        .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
        .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
        .print\\:shadow-none { box-shadow: none !important; }
        .print\\:border-none { border: none !important; }
        .print\\:rounded-none { border-radius: 0 !important; }
        .print\\:p-0 { padding: 0 !important; }
        
        .print-document { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; color: #000; }
        
        /* Hide in-page letterhead blocks; we use a fixed letterhead now */
        .company-header, .rule { display: none !important; }

        /* Headers inside content (titles, refs) stay */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin: 6px 0 10px; padding-bottom: 6px; }
        .page-title { font-size: 16px; font-weight: bold; text-decoration: underline; }
        .page-ref { font-size: 12px; font-weight: bold; }
        
        /* Materials Table */
        .materials-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .materials-table thead { display: table-header-group; } /* repeat header on next pages */
        .materials-table tbody { display: table-row-group; }
        .materials-table tr { page-break-inside: avoid; break-inside: avoid; }
        .materials-table th, .materials-table td { border: 1.6px solid #000; padding: 7px; text-align: left; vertical-align: top; }
        .materials-table th { background: #E6F0FA; font-weight: bold; text-align: center; font-size: 11px; }
        .materials-table tbody tr:last-child td { border-bottom-width: 2px; } /* closing rule */
        .col-no { width: 40px; text-align: center !important; }
        .col-description { width: auto; }
        .col-qty { width: 80px; text-align: center !important; }
        .col-price { width: 120px; text-align: right !important; }

        /* Sections */
        .section-title { font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 8px; text-transform: uppercase; }
      }
      
      /* Screen styles */
      .print-document { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; }
    `}</style>
  );
}
