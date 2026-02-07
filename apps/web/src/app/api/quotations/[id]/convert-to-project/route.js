import sql from "@/app/api/utils/sql.js";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Check user role - only leaders and sales can convert quotations
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "sales";

    if (userRole !== "leader" && userRole !== "sales") {
      return Response.json(
        { error: "Insufficient permissions to convert quotations" },
        { status: 403 },
      );
    }

    // Get quotation data with customer info
    const quotationResult = await sql`
      SELECT q.*, c.company_name, c.contact_name
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ${id}
    `;

    if (!quotationResult || quotationResult.length === 0) {
      return Response.json({ error: "Quotation not found" }, { status: 404 });
    }

    const quotation = quotationResult[0];

    // Check if quotation is approved
    if (quotation.status !== "approved") {
      return Response.json(
        { error: "Only approved quotations can be converted to projects" },
        { status: 400 },
      );
    }

    // Check if this quotation is already converted to a project
    const existingProjectResult = await sql`
      SELECT id, project_number 
      FROM projects 
      WHERE quotation_id = ${id}
    `;

    if (existingProjectResult && existingProjectResult.length > 0) {
      return Response.json(
        {
          error: "This quotation has already been converted to a project",
          project_id: existingProjectResult[0].id,
          project_number: existingProjectResult[0].project_number,
        },
        { status: 400 },
      );
    }

    // Generate project number
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);

    const lastProjectResult = await sql`
      SELECT project_number 
      FROM projects 
      WHERE project_number LIKE ${"PRJ" + yearSuffix + "%"}
      ORDER BY id DESC 
      LIMIT 1
    `;

    let projectNumber;
    if (lastProjectResult && lastProjectResult.length > 0) {
      const lastNumber = lastProjectResult[0].project_number;
      const lastSequence = parseInt(lastNumber.slice(-4)) || 0;
      const newSequence = (lastSequence + 1).toString().padStart(4, "0");
      projectNumber = `PRJ${yearSuffix}${newSequence}`;
    } else {
      projectNumber = `PRJ${yearSuffix}0001`;
    }

    // Create project from quotation
    const projectResult = await sql`
      INSERT INTO projects (
        project_number,
        quotation_id,
        customer_id,
        title,
        description,
        status,
        assigned_engineer,
        priority
      )
      VALUES (
        ${projectNumber},
        ${id},
        ${quotation.customer_id},
        ${quotation.title},
        ${quotation.description || "Project created from quotation " + quotation.quote_number},
        'planning',
        ${quotation.created_by},
        'medium'
      )
      RETURNING *
    `;

    const newProject = projectResult[0];

    // Get complete project data with customer info
    const completeProjectResult = await sql`
      SELECT 
        p.*,
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        q.quote_number,
        u.name as engineer_name
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN quotations q ON p.quotation_id = q.id
      LEFT JOIN auth_users u ON p.assigned_engineer = u.id
      WHERE p.id = ${newProject.id}
    `;

    return Response.json({
      message: "Quotation successfully converted to project",
      project: completeProjectResult[0],
      quotation_id: id,
    });
  } catch (err) {
    console.error(
      `POST /api/quotations/${params.id}/convert-to-project error`,
      err,
    );
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
