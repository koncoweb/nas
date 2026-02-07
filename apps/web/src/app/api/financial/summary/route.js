import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const roleRes =
      await sql`SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1`;
    const role = roleRes[0]?.user_role || "sales";

    // If leader/accounting -> full company view; otherwise -> fallback scoped to user's own records
    let revenue_total = 0;
    let cost_project_total = 0;
    let cost_operational_total = 0;
    let expense_total = 0;
    let profit = 0;
    let margin = 0;
    let projects = [];
    let cash_flow = [];

    if (["leader", "accounting"].includes(role)) {
      // Company-level revenue and expenses
      const [revRow] =
        await sql`SELECT COALESCE(SUM(total_amount),0)::numeric AS revenue_total FROM invoices`;
      const [projCostRow] =
        await sql`SELECT COALESCE(SUM(total_cost),0)::numeric AS cost_project_total FROM project_costs WHERE project_id IS NOT NULL`;
      const [opCostRow] =
        await sql`SELECT COALESCE(SUM(total_cost),0)::numeric AS cost_operational_total FROM project_costs WHERE project_id IS NULL`;

      revenue_total = parseFloat(revRow?.revenue_total || 0);
      cost_project_total = parseFloat(projCostRow?.cost_project_total || 0);
      cost_operational_total = parseFloat(
        opCostRow?.cost_operational_total || 0,
      );
      expense_total = cost_project_total + cost_operational_total;
      profit = revenue_total - expense_total;
      margin = revenue_total > 0 ? profit / revenue_total : 0;

      const projectRows = await sql`
        WITH inv AS (
          SELECT project_id, COALESCE(SUM(total_amount),0)::numeric AS revenue
          FROM invoices
          WHERE project_id IS NOT NULL
          GROUP BY project_id
        ),
        cst AS (
          SELECT project_id, COALESCE(SUM(total_cost),0)::numeric AS cost
          FROM project_costs
          WHERE project_id IS NOT NULL
          GROUP BY project_id
        )
        SELECT 
          p.id,
          p.project_number,
          p.title,
          COALESCE(inv.revenue,0)::numeric AS revenue,
          COALESCE(cst.cost,0)::numeric AS cost,
          (COALESCE(inv.revenue,0) - COALESCE(cst.cost,0))::numeric AS profit
        FROM projects p
        LEFT JOIN inv ON inv.project_id = p.id
        LEFT JOIN cst ON cst.project_id = p.id
        ORDER BY revenue DESC NULLS LAST, p.created_at DESC
        LIMIT 20
      `;

      projects = (projectRows || []).map((r) => ({
        id: r.id,
        project_number: r.project_number,
        title: r.title,
        revenue: parseFloat(r.revenue || 0),
        cost: parseFloat(r.cost || 0),
        profit: parseFloat(r.profit || 0),
        margin:
          parseFloat(r.revenue || 0) > 0
            ? parseFloat(
                (
                  parseFloat(r.profit || 0) / parseFloat(r.revenue || 0)
                ).toFixed(4),
              )
            : 0,
      }));

      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
        );
        const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        months.push(ym);
      }

      const paymentRows = await sql`
        SELECT to_char(payment_date, 'YYYY-MM') AS ym, COALESCE(SUM(amount),0)::numeric AS amt
        FROM payments
        WHERE payment_date IS NOT NULL AND payment_date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
      `;
      const expenseRows = await sql`
        SELECT to_char(COALESCE(purchase_date, created_at::date), 'YYYY-MM') AS ym, COALESCE(SUM(total_cost),0)::numeric AS amt
        FROM project_costs
        WHERE COALESCE(purchase_date, created_at::date) >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
      `;

      const inflowMap = Object.fromEntries(
        (paymentRows || []).map((r) => [r.ym, parseFloat(r.amt || 0)]),
      );
      const outflowMap = Object.fromEntries(
        (expenseRows || []).map((r) => [r.ym, parseFloat(r.amt || 0)]),
      );
      cash_flow = months.map((ym) => ({
        month: ym,
        inflow: inflowMap[ym] || 0,
        outflow: outflowMap[ym] || 0,
        net: (inflowMap[ym] || 0) - (outflowMap[ym] || 0),
      }));
    } else {
      // Fallback: scope to the current user's created records to avoid exposing company-wide data
      const [revRow] = await sql`
        SELECT COALESCE(SUM(total_amount),0)::numeric AS revenue_total FROM invoices WHERE created_by = ${userId}
      `;
      const [projCostRow] = await sql`
        SELECT COALESCE(SUM(total_cost),0)::numeric AS cost_project_total FROM project_costs WHERE project_id IS NOT NULL AND created_by = ${userId}
      `;
      const [opCostRow] = await sql`
        SELECT COALESCE(SUM(total_cost),0)::numeric AS cost_operational_total FROM project_costs WHERE project_id IS NULL AND created_by = ${userId}
      `;

      revenue_total = parseFloat(revRow?.revenue_total || 0);
      cost_project_total = parseFloat(projCostRow?.cost_project_total || 0);
      cost_operational_total = parseFloat(
        opCostRow?.cost_operational_total || 0,
      );
      expense_total = cost_project_total + cost_operational_total;
      profit = revenue_total - expense_total;
      margin = revenue_total > 0 ? profit / revenue_total : 0;

      const projectRows = await sql`
        WITH inv AS (
          SELECT project_id, COALESCE(SUM(total_amount),0)::numeric AS revenue
          FROM invoices
          WHERE project_id IS NOT NULL AND created_by = ${userId}
          GROUP BY project_id
        ),
        cst AS (
          SELECT project_id, COALESCE(SUM(total_cost),0)::numeric AS cost
          FROM project_costs
          WHERE project_id IS NOT NULL AND created_by = ${userId}
          GROUP BY project_id
        )
        SELECT 
          p.id,
          p.project_number,
          p.title,
          COALESCE(inv.revenue,0)::numeric AS revenue,
          COALESCE(cst.cost,0)::numeric AS cost,
          (COALESCE(inv.revenue,0) - COALESCE(cst.cost,0))::numeric AS profit
        FROM projects p
        LEFT JOIN inv ON inv.project_id = p.id
        LEFT JOIN cst ON cst.project_id = p.id
        WHERE inv.revenue IS NOT NULL OR cst.cost IS NOT NULL
        ORDER BY revenue DESC NULLS LAST, p.created_at DESC
        LIMIT 20
      `;

      projects = (projectRows || []).map((r) => ({
        id: r.id,
        project_number: r.project_number,
        title: r.title,
        revenue: parseFloat(r.revenue || 0),
        cost: parseFloat(r.cost || 0),
        profit: parseFloat(r.profit || 0),
        margin:
          parseFloat(r.revenue || 0) > 0
            ? parseFloat(
                (
                  parseFloat(r.profit || 0) / parseFloat(r.revenue || 0)
                ).toFixed(4),
              )
            : 0,
      }));

      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
        );
        const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        months.push(ym);
      }

      const paymentRows = await sql`
        SELECT to_char(payment_date, 'YYYY-MM') AS ym, COALESCE(SUM(amount),0)::numeric AS amt
        FROM payments
        WHERE created_by = ${userId} AND payment_date IS NOT NULL AND payment_date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
      `;
      const expenseRows = await sql`
        SELECT to_char(COALESCE(purchase_date, created_at::date), 'YYYY-MM') AS ym, COALESCE(SUM(total_cost),0)::numeric AS amt
        FROM project_costs
        WHERE created_by = ${userId} AND COALESCE(purchase_date, created_at::date) >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
      `;

      const inflowMap = Object.fromEntries(
        (paymentRows || []).map((r) => [r.ym, parseFloat(r.amt || 0)]),
      );
      const outflowMap = Object.fromEntries(
        (expenseRows || []).map((r) => [r.ym, parseFloat(r.amt || 0)]),
      );
      cash_flow = months.map((ym) => ({
        month: ym,
        inflow: inflowMap[ym] || 0,
        outflow: outflowMap[ym] || 0,
        net: (inflowMap[ym] || 0) - (outflowMap[ym] || 0),
      }));
    }

    return Response.json({
      company: {
        revenue_total,
        expense_total,
        cost_project_total,
        cost_operational_total,
        profit,
        margin,
      },
      projects,
      cash_flow,
    });
  } catch (err) {
    console.error("GET /api/financial/summary error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
