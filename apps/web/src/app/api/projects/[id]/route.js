import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Validate that id is a valid integer
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const rows = await sql`
      SELECT 
        p.*,
        c.company_name as customer_name,
        u.name as engineer_name,
        q.quote_number as quotation_number
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON p.assigned_engineer = u.id
      LEFT JOIN quotations q ON p.quotation_id = q.id
      WHERE p.id = ${projectId}
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ project: rows[0] });
  } catch (error) {
    console.error("Error fetching project:", error);
    return Response.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Validate that id is a valid integer
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const userId = session.user.id;

    // NEW: Enforce role-based permissions for updating a project
    const roleRows = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = roleRows?.[0]?.user_role || "sales";

    // Fetch current project to check ownership/assignment
    const currentRows = await sql`
      SELECT id, assigned_engineer FROM projects WHERE id = ${projectId} LIMIT 1
    `;
    if (currentRows.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const current = currentRows[0];

    // Permission rules:
    // - leaders and sales can update any project
    // - engineers can only update projects assigned to them
    if (
      userRole === "engineer" &&
      Number(current.assigned_engineer) !== Number(userId)
    ) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(body.title);
      paramCount++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(body.description);
      paramCount++;
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(body.status);
      paramCount++;
    }

    if (body.priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      values.push(body.priority);
      paramCount++;
    }

    if (body.assigned_engineer !== undefined) {
      updates.push(`assigned_engineer = $${paramCount}`);
      values.push(body.assigned_engineer);
      paramCount++;
    }

    if (body.start_date !== undefined) {
      updates.push(`start_date = $${paramCount}`);
      values.push(body.start_date);
      paramCount++;
    }

    if (body.expected_completion !== undefined) {
      updates.push(`expected_completion = $${paramCount}`);
      values.push(body.expected_completion);
      paramCount++;
    }

    if (body.actual_completion !== undefined) {
      updates.push(`actual_completion = $${paramCount}`);
      values.push(body.actual_completion);
      paramCount++;
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at, no actual changes
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    // Add the id as the last parameter
    values.push(projectId);

    const updateQuery = `
      UPDATE projects
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const rows = await sql(updateQuery, values);

    if (rows.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch the updated project with joined data
    const updatedProject = await sql`
      SELECT 
        p.*,
        c.company_name as customer_name,
        u.name as engineer_name,
        q.quote_number as quotation_number
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON p.assigned_engineer = u.id
      LEFT JOIN quotations q ON p.quotation_id = q.id
      WHERE p.id = ${projectId}
    `;

    return Response.json({ project: updatedProject[0] });
  } catch (error) {
    console.error("Error updating project:", error);
    return Response.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}
