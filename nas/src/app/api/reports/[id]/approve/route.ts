import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has authorization to approve (leader role)
  if (session.user.role !== "leader") {
    return NextResponse.json(
      { error: "Only leaders can approve reports" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params
    const reportId = parseInt(id)
    
    // Get current report
    const [report] = await sql`
      SELECT pr.*, p.id as project_id, p.status as project_status
      FROM project_reports pr
      JOIN projects p ON pr.project_id = p.id
      WHERE pr.id = ${reportId}
    `

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Validate status workflow: can only approve from submitted status
    if (report.status !== "submitted") {
      return NextResponse.json(
        {
          error: `Cannot approve report with status ${report.status}. Report must be submitted first.`,
        },
        { status: 400 }
      );
    }

    // Begin transaction: update report status and project status
    // Update report to approved
    const [updatedReport] = await sql`
      UPDATE project_reports 
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${reportId}
      RETURNING *
    `

    // Update project status to completed
    await sql`
      UPDATE projects 
      SET status = 'completed', 
          actual_completion = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${report.project_id}
    `

    return NextResponse.json({
      report: updatedReport,
      message: "Report approved and project marked as completed",
    });
  } catch (error) {
    console.error("Failed to approve report:", error);
    return NextResponse.json(
      { error: "Failed to approve report" },
      { status: 500 }
    );
  }
}
