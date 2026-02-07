import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

// Helper function to retry database queries on connection errors
async function retryQuery(queryFn, maxRetries = 2) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await queryFn();
    } catch (err) {
      lastError = err;
      // Retry on connection errors
      if (
        err.code === "57P01" ||
        err.message?.includes("terminating connection")
      ) {
        if (i < maxRetries) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
          continue;
        }
      }
      // Don't retry on other errors
      throw err;
    }
  }
  throw lastError;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    // Get user role to determine what stats to show
    const userId = session.user.id;

    let userRole = "sales";
    try {
      const userResult = await retryQuery(
        () => sql`
        SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
      `,
      );
      userRole = userResult[0]?.user_role || "sales";
    } catch (err) {
      console.error("Error fetching user role:", err);
      // Continue with default role
    }

    // Base stats that all users can see
    let stats = {
      totalQuotes: 0,
      activeProjects: 0,
      pendingInvoices: 0,
      monthlyRevenue: 0,
    };

    try {
      // Get total quotations
      const quotesResult = await retryQuery(
        () => sql`
        SELECT COUNT(*)::int as count FROM quotations
      `,
      );
      stats.totalQuotes = quotesResult[0]?.count || 0;
    } catch (err) {
      console.error("Error fetching quotes count:", err);
      stats.totalQuotes = 0;
    }

    try {
      // Get active projects
      const projectsResult = await retryQuery(
        () => sql`
        SELECT COUNT(*)::int as count 
        FROM projects 
        WHERE status IN ('planning', 'in_progress')
      `,
      );
      stats.activeProjects = projectsResult[0]?.count || 0;
    } catch (err) {
      console.error("Error fetching projects count:", err);
      stats.activeProjects = 0;
    }

    // Role-specific stats
    if (userRole === "leader" || userRole === "accounting") {
      try {
        // Get pending invoices
        const invoicesResult = await retryQuery(
          () => sql`
          SELECT COUNT(*)::int as count 
          FROM invoices 
          WHERE status IN ('draft', 'sent', 'partial')
        `,
        );
        stats.pendingInvoices = invoicesResult[0]?.count || 0;
      } catch (err) {
        console.error("Error fetching invoices count:", err);
        stats.pendingInvoices = 0;
      }

      try {
        // Get monthly revenue (current month)
        const currentMonth = new Date();
        const startOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
        );

        const revenueResult = await retryQuery(
          () => sql`
          SELECT COALESCE(SUM(amount_paid), 0)::numeric as total 
          FROM invoices 
          WHERE created_at >= ${startOfMonth.toISOString()} 
          AND created_at <= ${endOfMonth.toISOString()}
        `,
        );
        stats.monthlyRevenue = parseFloat(revenueResult[0]?.total || 0);
      } catch (err) {
        console.error("Error fetching monthly revenue:", err);
        stats.monthlyRevenue = 0;
      }
    } else {
      // For sales and engineers, show limited financial data
      stats.pendingInvoices = 0;
      stats.monthlyRevenue = 0;
    }

    return successResponse(stats);
  } catch (err) {
    console.error("GET /api/dashboard/stats error", err);
    // Return a valid response even on error for graceful degradation
    return successResponse({
      totalQuotes: 0,
      activeProjects: 0,
      pendingInvoices: 0,
      monthlyRevenue: 0,
      error: "Failed to load stats",
    });
  }
}
