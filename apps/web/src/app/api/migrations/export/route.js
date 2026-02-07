import { auth } from "@/auth";
import { getAllMigrationsSQL } from "@/app/api/utils/migrations";
import sql from "@/app/api/utils/sql";

/**
 * Export all migrations as a single SQL file
 * GET /api/migrations/export
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Only leaders can export migrations
    const userId = session.user.id;
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role;

    if (userRole !== "leader") {
      return new Response("Only leaders can export database migrations", {
        status: 403,
      });
    }

    // Get all migrations SQL
    const allSQL = getAllMigrationsSQL();

    // Add header
    const header = `--
-- Marine Engineering Project Management System
-- Complete Database Schema
-- Generated: ${new Date().toISOString()}
--
-- This file contains all database migrations.
-- It is safe to run this on an empty database.
--

`;

    const fullSQL = header + allSQL;

    // Return as downloadable SQL file
    return new Response(fullSQL, {
      status: 200,
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": 'attachment; filename="database-schema.sql"',
      },
    });
  } catch (err) {
    console.error("GET /api/migrations/export error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
