import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatZodErrors } from "@/lib/validations";
import { z } from "zod";

const updateReportSchema = z.object({
  completion_date: z.string().transform((str) => new Date(str)).optional(),
  work_summary: z.string().min(1).optional(),
  materials_used: z.string().min(1).optional(),
  customer_signature_url: z.string().url().nullable().optional(),
  status: z.enum(["draft", "submitted", "approved"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params
    const reportId = parseInt(id)
    
    const [report] = await sql`
      SELECT 
        pr.*,
        p.project_number,
        p.title as project_title,
        p.status as project_status,
        c.company_name as customer_name
      FROM project_reports pr
      JOIN projects p ON pr.project_id = p.id
      JOIN customers c ON p.customer_id = c.id
      WHERE pr.id = ${reportId}
    `

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params
    const reportId = parseInt(id)
    
    const body = await request.json();
    const validated = updateReportSchema.parse(body);

    // Get current report
    const [currentReport] = await sql`
      SELECT * FROM project_reports WHERE id = ${reportId}
    `

    if (!currentReport) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Validate status workflow: draft → submitted → approved
    if (validated.status && validated.status !== currentReport.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["submitted"],
        submitted: ["approved", "draft"],
        approved: [], // Cannot transition from approved
      };

      const allowedTransitions = validTransitions[currentReport.status] || [];
      if (!allowedTransitions.includes(validated.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${currentReport.status} to ${validated.status}`,
          },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (validated.completion_date !== undefined) {
      updates.push(`completion_date = $${paramIndex}`);
      values.push(validated.completion_date);
      paramIndex++;
    }

    if (validated.work_summary !== undefined) {
      updates.push(`work_summary = $${paramIndex}`);
      values.push(validated.work_summary);
      paramIndex++;
    }

    if (validated.materials_used !== undefined) {
      updates.push(`materials_used = $${paramIndex}`);
      values.push(validated.materials_used);
      paramIndex++;
    }

    if (validated.customer_signature_url !== undefined) {
      updates.push(`customer_signature_url = $${paramIndex}`);
      values.push(validated.customer_signature_url);
      paramIndex++;
    }

    if (validated.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(validated.status);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at, nothing to update
      return NextResponse.json(currentReport);
    }

    values.push(reportId);

    const setClause = updates.map((update, i) => {
      const value = values[i];
      if (typeof value === 'string') {
        return update.replace(/\$\d+/, `'${value}'`);
      } else if (value instanceof Date) {
        return update.replace(/\$\d+/, `'${value.toISOString()}'`);
      } else {
        return update.replace(/\$\d+/, `${value}`);
      }
    }).join(', ');
    
    const result = await sql`
      UPDATE project_reports 
      SET ${sql.unsafe(setClause)}
      WHERE id = ${reportId}
      RETURNING *
    `;
    
    const updatedReport = result[0];

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("Failed to update report:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: formatZodErrors(error) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
