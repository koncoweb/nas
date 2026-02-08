import { NextResponse } from "next/server"
import { sql, testConnection } from "@/lib/db"

export async function GET() {
  try {
    // Test basic connectivity
    const isConnected = await testConnection()
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          error: "Database connection failed",
          connected: false 
        },
        { status: 500 }
      )
    }

    // Test querying actual tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Get a count of users to verify we can read from auth_users
    const userCount = await sql`
      SELECT COUNT(*) as count FROM auth_users
    `

    return NextResponse.json({
      connected: true,
      message: "Database connection successful",
      tables: tables.map(t => t.table_name),
      userCount: parseInt(userCount[0].count as string)
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { 
        error: "Database operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
        connected: false
      },
      { status: 500 }
    )
  }
}
