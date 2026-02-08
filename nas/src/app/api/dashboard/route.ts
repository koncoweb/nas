import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Tidak terotorisasi" }, { status: 401 })
    }

    const userRole = session.user.role

    // Get statistics
    const [projectStats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'in_progress') as active_projects,
        COUNT(*) FILTER (WHERE status = 'planning') as planning_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_projects
      FROM projects
    `

    const [quotationStats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'draft') as draft_quotations,
        COUNT(*) FILTER (WHERE status = 'sent') as pending_quotations,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_quotations
      FROM quotations
    `

    const [materialRequestStats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'submitted') as pending_material_requests,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review_requests,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_requests
      FROM material_requests
    `

    // Get recent activities (last 10 items across quotations, projects, and invoices)
    const recentQuotations = await sql`
      SELECT 
        'quotation' as type,
        id,
        title as name,
        status,
        created_at,
        updated_at
      FROM quotations
      ORDER BY updated_at DESC
      LIMIT 5
    `

    const recentProjects = await sql`
      SELECT 
        'project' as type,
        id,
        title as name,
        status,
        created_at,
        updated_at
      FROM projects
      ORDER BY updated_at DESC
      LIMIT 5
    `

    const recentInvoices = await sql`
      SELECT 
        'invoice' as type,
        i.id,
        i.invoice_number as name,
        i.status,
        i.created_at,
        i.updated_at
      FROM invoices i
      ORDER BY i.updated_at DESC
      LIMIT 5
    `

    // Combine and sort recent activities
    const recentActivities = [
      ...recentQuotations,
      ...recentProjects,
      ...recentInvoices
    ]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)

    // Get approval items for leaders
    let approvalItems: any[] = []
    if (userRole === "leader") {
      const pendingMaterialRequests = await sql`
        SELECT 
          'material_request' as type,
          mr.id,
          mr.title as name,
          mr.urgency,
          mr.status,
          mr.created_at,
          p.title as project_title
        FROM material_requests mr
        JOIN projects p ON mr.project_id = p.id
        WHERE mr.status IN ('submitted', 'under_review')
        ORDER BY 
          CASE mr.urgency
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          mr.created_at ASC
        LIMIT 10
      `

      const pendingReports = await sql`
        SELECT 
          'project_report' as type,
          pr.id,
          p.title as name,
          pr.status,
          pr.created_at,
          p.title as project_title
        FROM project_reports pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.status = 'submitted'
        ORDER BY pr.created_at ASC
        LIMIT 10
      `

      approvalItems = [...pendingMaterialRequests, ...pendingReports]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    // Build response based on user role
    const statistics = {
      activeProjects: parseInt(projectStats.active_projects) || 0,
      planningProjects: parseInt(projectStats.planning_projects) || 0,
      completedProjects: parseInt(projectStats.completed_projects) || 0,
      draftQuotations: parseInt(quotationStats.draft_quotations) || 0,
      pendingQuotations: parseInt(quotationStats.pending_quotations) || 0,
      approvedQuotations: parseInt(quotationStats.approved_quotations) || 0,
      pendingMaterialRequests: parseInt(materialRequestStats.pending_material_requests) || 0,
      underReviewRequests: parseInt(materialRequestStats.under_review_requests) || 0,
      approvedRequests: parseInt(materialRequestStats.approved_requests) || 0
    }

    return NextResponse.json({
      statistics,
      recentActivities,
      approvalItems,
      userRole
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data dashboard" },
      { status: 500 }
    )
  }
}
