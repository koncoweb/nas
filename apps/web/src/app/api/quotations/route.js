import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    // Get user role to determine access
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    // Base query with proper parameter indexing
    let whereConditions = ["1=1"];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        LOWER(q.title) LIKE LOWER($${paramIndex}) OR
        LOWER(q.quote_number) LIKE LOWER($${paramIndex}) OR
        LOWER(c.company_name) LIKE LOWER($${paramIndex}) OR
        LOWER(q.vessel_name) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`q.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // For engineers, hide pricing information
    const selectFields =
      userRole === "engineer"
        ? `q.id, q.quote_number, q.title, q.description, q.service_type, 
         q.vessel_name, q.location, q.revision_number,
         q.status, q.valid_until, q.notes, q.created_at, q.updated_at,
         c.company_name as customer_name, 
         u.name as created_by_name,
         p.id as project_id,
         p.project_number,
         p.status as project_status`
        : `q.*, c.company_name as customer_name, u.name as created_by_name, p.id as project_id, p.project_number, p.status as project_status`;

    // Get quotations with customer, creator, and project info - Fixed parameter indexing
    const quotationsQuery = `
      SELECT ${selectFields}
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN auth_users u ON q.created_by = u.id
      LEFT JOIN projects p ON q.id = p.quotation_id
      WHERE ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const quotations = await sql(quotationsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN projects p ON q.id = p.quotation_id
      WHERE ${whereClause}
    `;

    const countResult = await sql(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
    const total = parseInt(countResult[0]?.total || 0);

    return Response.json({
      quotations: quotations || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/quotations error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role - only leaders and sales can create quotations
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    if (userRole !== "leader" && userRole !== "sales") {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      customer_id,
      title,
      description,
      service_type,
      vessel_name,
      location,
      revision_number = 0,
      labor_hours = 0,
      labor_rate = 0,
      materials_cost = 0,
      profit_margin = 0,
      time_estimation_supply,
      time_estimation_work,
      payment_percentage = 100,
      payment_timing = "Upon work completion",
      validity_days = 7,
      other_terms,
      valid_until,
      notes,
      line_items = [],
      scope_work = [],
      scope_of_work_groups = [],
      currency: bodyCurrency,
    } = body;

    // Validate required fields
    if (!customer_id || !title) {
      return Response.json(
        { error: "Customer and title are required" },
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

    // Validate numeric fields
    const validLaborHours = Math.max(0, parseFloat(labor_hours) || 0);
    const validLaborRate = Math.max(0, parseFloat(labor_rate) || 0);
    const validMaterialsCost = Math.max(0, parseFloat(materials_cost) || 0);
    const validProfitMargin = Math.max(0, Math.min(100, parseFloat(profit_margin) || 0));

    // Normalize currency to allowed set (IDR, USD, SGD)
    const allowed = ["IDR", "USD", "SGD"];
    const currency = (bodyCurrency || "IDR").toString().toUpperCase();
    const safeCurrency = allowed.includes(currency) ? currency : "IDR";

    // Use transaction to ensure atomic quote number generation
    const result = await sql.transaction(async (tx) => {
      // Generate quote number atomically within transaction
      const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
      const countResult = await tx`
        SELECT COUNT(*) as count 
        FROM quotations 
        WHERE quote_number LIKE ${"Q-" + yearMonth + "%"}
        FOR UPDATE
      `;
      const count = parseInt(countResult[0]?.count || 0) + 1;
      const quote_number = `Q-${yearMonth}-${count.toString().padStart(3, "0")}`;

      // If UI sent hierarchical groups, flatten them into line_items and scope_work
      let finalLineItems = Array.isArray(line_items) ? [...line_items] : [];
      let finalScopeWork = Array.isArray(scope_work) ? [...scope_work] : [];

      if (Array.isArray(scope_of_work_groups) && scope_of_work_groups.length) {
        finalLineItems = [];
        finalScopeWork = [];
        scope_of_work_groups.forEach((group, gIdx) => {
          const title = (group?.title || "").trim();
          if (title) {
            finalScopeWork.push({
              description: title,
              work_category: null,
              estimated_hours: 0,
            });
          }
          (group?.items || []).forEach((it, iIdx) => {
            finalLineItems.push({
              description: it.description || "",
              quantity: Math.max(0, parseFloat(it.quantity) || 0),
              unit_type: it.unit_type || "Unit",
              unit_price: Math.max(0, parseFloat(it.unit_price) || 0),
              item_type: it.item_type || "material",
              material_id: it.material_id || null,
              scope_group: title || null,
            });
          });
        });
      }

      // Calculate costs from line items with validation
      let total_materials_cost = 0;
      for (const item of finalLineItems) {
        const quantity = Math.max(0, parseFloat(item.quantity) || 0);
        const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
        total_materials_cost += quantity * unitPrice;
      }

      const labor_cost = validLaborHours * validLaborRate;
      const total_cost = labor_cost + total_materials_cost + validMaterialsCost;
      const profit_amount = total_cost * (validProfitMargin / 100);
      const final_price = total_cost + profit_amount;

      // Create the quotation
      const quotationResult = await tx`
        INSERT INTO quotations (
          quote_number, customer_id, created_by, title, description, service_type,
          vessel_name, location, revision_number,
          labor_hours, labor_rate, labor_cost, materials_cost, total_cost,
          profit_margin, final_price, 
          time_estimation_supply, time_estimation_work, 
          payment_percentage, payment_timing, validity_days, other_terms,
          valid_until, notes, status, currency
        )
        VALUES (
          ${quote_number}, ${validCustomerId}, ${userId}, ${title}, ${description || null},
          ${service_type || null}, ${vessel_name || null}, ${location || null}, ${revision_number},
          ${validLaborHours}, ${validLaborRate}, ${labor_cost},
          ${total_materials_cost}, ${total_cost}, ${validProfitMargin}, ${final_price},
          ${time_estimation_supply || null}, ${time_estimation_work || null},
          ${payment_percentage}, ${payment_timing}, ${validity_days}, ${other_terms || null},
          ${valid_until || null}, ${notes || null}, 'draft', ${safeCurrency}
        )
        RETURNING *
      `;

      const quotation = quotationResult[0];

      // Insert line items
      for (let i = 0; i < finalLineItems.length; i++) {
        const item = finalLineItems[i];
        const quantity = Math.max(0, parseFloat(item.quantity) || 0);
        const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
        const line_total = quantity * unitPrice;

        await tx`
          INSERT INTO quotation_line_items (
            quotation_id, material_id, description, quantity, unit_type, 
            unit_price, line_total, line_order, item_type, scope_group
          )
          VALUES (
            ${quotation.id}, ${item.material_id || null}, ${item.description},
            ${quantity}, ${item.unit_type || "Unit"}, 
            ${unitPrice}, ${line_total}, ${i + 1}, ${item.item_type || "material"}, ${item.scope_group || null}
          )
        `;
      }

      // Insert scope of work
      for (let i = 0; i < finalScopeWork.length; i++) {
        const work = finalScopeWork[i];
        await tx`
          INSERT INTO quotation_scope_work (
            quotation_id, step_number, description, work_category, estimated_hours
          )
          VALUES (
            ${quotation.id}, ${i + 1}, ${work.description},
            ${work.work_category || null}, ${Math.max(0, parseFloat(work.estimated_hours) || 0)}
          )
        `;
      }

      return quotation;
    });

    return Response.json({ quotation: result }, { status: 201 });
  } catch (err) {
    console.error("POST /api/quotations error", err);
    if (err.message?.includes('duplicate key')) {
      return Response.json({ error: "Quote number already exists. Please try again." }, { status: 409 });
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}