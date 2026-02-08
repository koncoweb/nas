import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { z } from "zod";

const reportSchema = z.object({
  project_id: z.number().positive(),
  completion_date: z.string().transform((str) => new Date(str)),
  work_summary: z.string().min(1, "Work summary is required"),
  materials_used: z.string().min(1, "Materials used is required"),
  customer_signature_url: z.string().optional().nullable(),
  status: z.enum(["pending", "customer_signed", "completed"]).optional().default("pending"),
});

function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const projectId = searchParams.get("project_id");
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  try {
    let whereParts: string[] = [];

    if (projectId) {
      whereParts.push(`pr.project_id = ${parseInt(projectId)}`);
    }

    if (status) {
      whereParts.push(`pr.status = '${status}'`);
    }

    const whereClause = whereParts.length > 0 
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    // Use template literal with sql.unsafe for dynamic WHERE clause
    const reports = await sql`
      SELECT 
        pr.*,
        p.project_number,
        p.title as project_title,
        c.company_name as customer_name
      FROM project_reports pr
      JOIN projects p ON pr.project_id = p.id
      JOIN customers c ON p.customer_id = c.id
      ${sql.unsafe(whereClause)}
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM project_reports pr
      ${sql.unsafe(whereClause)}
    `;
    
    const count = countResult[0].count;

    return NextResponse.json({
      data: reports,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = reportSchema.parse(body);

    // Verify project exists
    const projectResult = await sql`
      SELECT id, status FROM projects WHERE id = ${validated.project_id}
    `;

    if (projectResult.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const reportResult = await sql`
      INSERT INTO project_reports (
        project_id, 
        completion_date, 
        work_summary, 
        materials_used,
        customer_signature_url,
        status
      )
      VALUES (
        ${validated.project_id},
        ${validated.completion_date},
        ${validated.work_summary},
        ${validated.materials_used},
        ${validated.customer_signature_url || null},
        ${validated.status}
      )
      RETURNING *
    `;
    
    const report = reportResult[0];

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(error) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
