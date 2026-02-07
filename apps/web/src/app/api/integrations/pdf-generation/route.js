export async function POST(request) {
  try {
    const body = await request.json();
    const html = typeof body?.html === "string" ? body.html : null;
    const filenameRaw =
      typeof body?.filename === "string" ? body.filename : null;

    if (!html) {
      return Response.json({ error: "Missing html" }, { status: 400 });
    }

    const filename = sanitizeFilename(filenameRaw || "document.pdf");

    // Forward to the platform integration endpoint. This endpoint should be
    // configured to return application/pdf with Content-Disposition: attachment
    const baseUrl = process.env.APP_URL || "";
    const integrationUrl = `${baseUrl}/integrations/pdf-generation`;

    const res = await fetch(integrationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, fileName: filename, filename }),
    });

    if (!res.ok) {
      const text = await safeReadText(res);
      const status = res.status || 502;
      return new Response(text || "PDF generation failed", { status });
    }

    // Expect binary PDF back
    const ct = res.headers.get("content-type") || "application/pdf";
    const ab = await res.arrayBuffer();

    return new Response(ab, {
      headers: {
        "Content-Type": ct,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("POST /api/integrations/pdf-generation error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function sanitizeFilename(name) {
  try {
    const trimmed = String(name || "").trim();
    const noPath = trimmed.replace(/[\\/]/g, "-");
    const safe = noPath.replace(/[^A-Za-z0-9._-]+/g, "-");
    return safe || "document.pdf";
  } catch {
    return "document.pdf";
  }
}

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
