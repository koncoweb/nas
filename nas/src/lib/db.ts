import { neon, NeonQueryFunction } from "@neondatabase/serverless"

// Create a connection to the Neon database with connection pooling
// During build time, DATABASE_URL might not be set, so we handle that gracefully
export const sql: NeonQueryFunction<false, false> = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : (() => {
      throw new Error("DATABASE_URL environment variable is not set")
    }) as any

/**
 * Helper function for executing database transactions
 * Note: Neon serverless driver handles connection pooling automatically
 */
export async function withTransaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  try {
    return await callback(sql)
  } catch (error) {
    console.error("Transaction error:", error)
    throw error
  }
}

/**
 * Test database connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`
    return result.length > 0 && result[0].test === 1
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}
