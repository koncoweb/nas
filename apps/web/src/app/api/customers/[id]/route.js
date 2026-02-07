import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/customers/[id] - fetch single customer
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params?.id, 10);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM customers WHERE id = ${id} LIMIT 1`;
    const customer = rows[0];
    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    return Response.json({ customer });
  } catch (err) {
    console.error("GET /api/customers/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/customers/[id] - update a customer
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only leaders and sales can update customers (follow POST policy)
    const userId = session.user.id;
    const userRes =
      await sql`SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1`;
    const userRole = userRes[0]?.user_role || "sales";

    if (userRole !== "leader" && userRole !== "sales") {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const id = parseInt(params?.id, 10);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const body = await request.json();
    const allowedFields = [
      "company_name",
      "contact_name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zip_code",
    ];

    const setClauses = [];
    const values = [];

    allowedFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (
          key === "company_name" &&
          typeof body[key] === "string" &&
          body[key].trim() === ""
        ) {
          // Avoid setting empty company_name
          return;
        }
        values.push(body[key] === "" ? null : body[key]);
        setClauses.push(`${key} = $${values.length}`);
      }
    });

    if (setClauses.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Append id placeholder
    values.push(id);

    const query = `UPDATE customers SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    if (!result[0]) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    return Response.json({ customer: result[0] });
  } catch (err) {
    console.error("PUT /api/customers/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
