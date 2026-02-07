import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get company settings
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${session.user.id}
    `;

    if (userResult.length === 0) {
      return new Response("User not found", { status: 404 });
    }

    // Check if table exists, if not create it
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_settings'
      );
    `;

    if (!tableExists[0].exists) {
      // Create company_settings table
      await sql`
        CREATE TABLE company_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Insert default values
      const defaultSettings = [
        ["company_name", "PT. NATA AIR SAGARA"],
        ["company_tagline", "HVAC SERVICE SPECIALIST"],
        ["address_line1", "Jl. Gajah Mada – Tiban Baru"],
        ["address_line2", "Ruko Onassis Blok A No. 05"],
        ["address_line3", "Tiban Baru – Batam"],
        ["phone", "Tlp. 0778 8011360"],
        ["email", "info@nataairsagara.com"],
        ["director_name", "Cucup Supriatna"],
        ["director_title", "Commercial Manager"],
        ["director_email", "cucup@nataairsagara.com"],
        ["director_phone", "+62 81270121383"],
        ["director_did", "+62 778 8011360"],
        ["logo_url", ""],
        // Added new key for global full-page letterhead background image
        ["letterheadBackgroundUrl", ""],
      ];

      for (const [key, value] of defaultSettings) {
        await sql`
          INSERT INTO company_settings (setting_key, setting_value) 
          VALUES (${key}, ${value})
        `;
      }
    }

    // Get all settings
    const settingsResult = await sql`
      SELECT setting_key, setting_value FROM company_settings
    `;

    const settings = {};
    settingsResult.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return Response.json({ settings });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Save company settings
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${session.user.id}
    `;

    if (userResult.length === 0) {
      return new Response("User not found", { status: 404 });
    }

    const user = userResult[0];
    if (user.user_role !== "leader") {
      return new Response(
        "Forbidden: Only leaders can update company settings",
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      company_name,
      company_tagline,
      address_line1,
      address_line2,
      address_line3,
      phone,
      email,
      director_name,
      director_title,
      director_email,
      director_phone,
      director_did,
      logo_url,
      // New field accepted in API body
      letterheadBackgroundUrl,
    } = body;

    // Update or insert each setting
    const settings = [
      ["company_name", company_name],
      ["company_tagline", company_tagline],
      ["address_line1", address_line1],
      ["address_line2", address_line2],
      ["address_line3", address_line3],
      ["phone", phone],
      ["email", email],
      ["director_name", director_name],
      ["director_title", director_title],
      ["director_email", director_email],
      ["director_phone", director_phone],
      ["director_did", director_did],
      ["logo_url", logo_url],
      // Persist new letterhead background setting
      ["letterheadBackgroundUrl", letterheadBackgroundUrl],
    ];

    for (const [key, value] of settings) {
      await sql`
        INSERT INTO company_settings (setting_key, setting_value, updated_at) 
        VALUES (${key}, ${value || ""}, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return Response.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error saving company settings:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
