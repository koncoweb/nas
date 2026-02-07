import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/app/api/utils/query-builder.js";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = session.user.id;
    const rows = await sql`
      SELECT id, name, email, image, user_role 
      FROM auth_users 
      WHERE id = ${userId} 
      LIMIT 1
    `;

    const user = rows?.[0] || null;
    
    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ user });
  } catch (err) {
    console.error("GET /api/profile error", err);
    return errorResponse("Internal Server Error");
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Only leaders are allowed to change roles. This prevents privilege escalation.
    const roleRows = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const currentRole = roleRows?.[0]?.user_role || "sales";
    
    if (currentRole !== "leader") {
      return errorResponse("Only leaders can change roles", 403);
    }

    const body = await request.json();
    const { user_role } = body || {};

    // Validate the role
    const validRoles = ["leader", "sales", "accounting", "engineer"];
    if (!user_role || !validRoles.includes(user_role)) {
      return errorResponse(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        400
      );
    }

    // Update the user's role (self-only since there is no id param)
    const result = await sql`
      UPDATE auth_users 
      SET user_role = ${user_role}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId} 
      RETURNING id, name, email, image, user_role
    `;

    const updatedUser = result?.[0] || null;

    if (!updatedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      { user: updatedUser },
      "User role updated successfully"
    );
  } catch (err) {
    console.error("PUT /api/profile error", err);
    return errorResponse("Internal Server Error");
  }
}