import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const customer_id = searchParams.get("customer_id") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const offset = (page - 1) * limit;

    let whereConditions = ["1=1"];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        LOWER(i.invoice_number) LIKE LOWER($${paramIndex}) OR
        LOWER(c.company_name) LIKE LOWER($${paramIndex}) OR
        LOWER(c.contact_name) LIKE LOWER($${paramIndex}) OR
        LOWER(p.project_number) LIKE LOWER($${paramIndex}) OR
        LOWER(p.title) LIKE LOWER($${paramIndex}) OR
        LOWER(i.notes) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`i.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (customer_id) {
      const validCustomerId = parseInt(customer_id);
      if (!isNaN(validCustomerId) && validCustomerId > 0) {
        whereConditions.push(`i.customer_id = $${paramIndex}`);
        queryParams.push(validCustomerId);
        paramIndex++;
      }
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE ${whereClause}
    `;
    const countResult = await sql(countQuery, queryParams);
    const total = parseInt(countResult[0]?.total || 0);
    const pages = Math.ceil(total / limit);

    // Get invoices with related data - Fixed parameter indexing
    const invoicesQuery = `
      SELECT 
        i.*,
        c.company_name as customer_name,
        c.contact_name,
        p.project_number,
        p.title as project_title,
        u.name as created_by_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN auth_users u ON i.created_by = u.id
      WHERE ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const invoices = await sql(invoicesQuery, queryParams);

    return Response.json({
      invoices: invoices || [],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("GET /api/invoices error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    // Check permissions - leaders and accounting can create invoices
    if (!["leader", "accounting"].includes(userRole)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      project_id = null,
      customer_id,
      issue_date,
      payment_terms = "Net 30",
      tax_rate = 0,
      notes = null,
      line_items = [],
    } = body;

    // Validate required fields
    if (!customer_id) {
      return Response.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Validate customer_id is a positive integer
    const validCustomerId = parseInt(customer_id);
    if (isNaN(validCustomerId) || validCustomerId <= 0) {
      return Response.json(
        { error: "Invalid customer ID" },
        { status: 400 },
      );
    }

    if (!issue_date) {
      return Response.json(
        { error: "Issue date is required" },
        { status: 400 },
      );
    }

    if (
      !line_items.length ||
      !line_items.some((item) => item.description && item.description.trim())
    ) {
      return Response.json(
        { error: "At least one line item with description is required" },
        { status: 400 },
      );
    }

    // Validate tax_rate
    const validTaxRate = Math.max(0, Math.min(100, parseFloat(tax_rate) || 0));

    // Verify customer exists
    const customerCheck = await sql`
      SELECT id FROM customers WHERE id = ${validCustomerId} LIMIT 1
    `;

    if (!customerCheck.length) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    // If project_id provided, verify it exists and belongs to this customer
    let validProjectId = null;
    if (project_id) {
      const parsedProjectId = parseInt(project_id);
      if (!isNaN(parsedProjectId) && parsedProjectId > 0) {
        const projectCheck = await sql`
          SELECT id FROM projects 
          WHERE id = ${parsedProjectId} AND customer_id = ${validCustomerId}
          LIMIT 1
        `;

        if (!projectCheck.length) {
          return Response.json(
            { error: "Project not found or doesn't belong to this customer" },
            { status: 404 },
          );
        }
        validProjectId = parsedProjectId;
      }
    }

    // Calculate totals with validation
    const subtotal = line_items.reduce((sum, item) => {
      const quantity = Math.max(0, parseFloat(item.quantity) || 0);
      const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
      return sum + (quantity * unitPrice);
    }, 0);

    const taxAmount = subtotal * (validTaxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Calculate due date based on payment terms
    let dueDate = null;
    if (payment_terms === "Due on Receipt") {
      dueDate = issue_date;
    } else if (payment_terms.startsWith("Net ")) {
      const days = parseInt(payment_terms.replace("Net ", ""));
      if (!isNaN(days) && days > 0) {
        const issueDateObj = new Date(issue_date);
        issueDateObj.setDate(issueDateObj.getDate() + days);
        dueDate = issueDateObj.toISOString().split("T")[0];
      }
    }

    // Use transaction to ensure atomic invoice creation
    const result = await sql.transaction(async (tx) => {
      // Generate invoice number atomically
      const yearMonth = new Date(issue_date)
        .toISOString()
        .slice(0, 7)
        .replace("-", "");
      
      const lastInvoiceResult = await tx`
        SELECT invoice_number FROM invoices 
        WHERE invoice_number LIKE ${"INV-" + yearMonth + "-%"}
        ORDER BY invoice_number DESC
        LIMIT 1
        FOR UPDATE
      `;

      let invoiceNumber;
      if (lastInvoiceResult.length > 0) {
        const lastNumber = parseInt(
          lastInvoiceResult[0].invoice_number.split("-").pop(),
        );
        invoiceNumber = `INV-${yearMonth}-${String(lastNumber + 1).padStart(3, "0")}`;
      } else {
        invoiceNumber = `INV-${yearMonth}-001`;
      }

      // Create invoice
      const invoiceResult = await tx`
        INSERT INTO invoices (
          invoice_number, project_id, customer_id, issue_date, due_date,
          subtotal, tax_rate, tax_amount, total_amount, balance_due,
          status, payment_terms, notes, created_by
        )
        VALUES (
          ${invoiceNumber}, ${validProjectId}, ${validCustomerId}, 
          ${issue_date}, ${dueDate}, ${subtotal.toFixed(2)}, ${validTaxRate},
          ${taxAmount.toFixed(2)}, ${totalAmount.toFixed(2)}, ${totalAmount.toFixed(2)},
          'draft', ${payment_terms}, ${notes}, ${userId}
        )
        RETURNING *
      `;

      const invoice = invoiceResult[0];

      // Insert line items with validation
      const cleanedItems = line_items
        .map((item, i) => ({
          description: (item.description || "").trim(),
          quantity: Math.max(0, parseFloat(item.quantity) || 0),
          unit_price: Math.max(0, parseFloat(item.unit_price) || 0),
          line_order: i + 1,
        }))
        .filter((it) => it.description);

      for (const item of cleanedItems) {
        const lineTotal = item.quantity * item.unit_price;
        await tx`
          INSERT INTO invoice_line_items (
            invoice_id, description, quantity, unit_price, line_total, line_order
          )
          VALUES (
            ${invoice.id}, ${item.description}, ${item.quantity}, 
            ${item.unit_price}, ${lineTotal}, ${item.line_order}
          )
        `;
      }

      return invoice;
    });

    return Response.json({
      invoice: result,
      message: "Invoice created successfully",
    });
  } catch (err) {
    console.error("POST /api/invoices error", err);
    if (err.message?.includes('duplicate key')) {
      return Response.json({ error: "Invoice number already exists. Please try again." }, { status: 409 });
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}