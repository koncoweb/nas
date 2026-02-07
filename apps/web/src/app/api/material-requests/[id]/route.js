import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    console.log("GET /api/material-requests/[id] - Start", { params });

    const session = await auth();
    if (!session || !session.user?.id) {
      console.error("GET /api/material-requests/[id] - Unauthorized");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    if (!id) {
      console.error("GET /api/material-requests/[id] - Missing ID");
      return new Response(
        JSON.stringify({ error: "Material request ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const userId = session.user.id;
    console.log("GET /api/material-requests/[id] - User", {
      userId,
      requestId: id,
    });

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";
    console.log("GET /api/material-requests/[id] - User role", userRole);

    // Get material request with access control
    let materialRequestQuery;
    let queryParams = [id];

    if (userRole === "engineer") {
      // Engineers can only see their own requests
      materialRequestQuery = `
        SELECT mr.*, p.title as project_title, p.project_number,
               c.company_name as customer_name, u.name as requested_by_name
        FROM material_requests mr
        LEFT JOIN projects p ON mr.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN auth_users u ON mr.requested_by = u.id
        WHERE mr.id = $1 AND mr.requested_by = $2
      `;
      queryParams.push(userId);
    } else if (userRole === "sales") {
      // Sales can see their own requests AND any requests that need review
      materialRequestQuery = `
        SELECT mr.*, p.title as project_title, p.project_number,
               c.company_name as customer_name, u.name as requested_by_name
        FROM material_requests mr
        LEFT JOIN projects p ON mr.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN auth_users u ON mr.requested_by = u.id
        WHERE mr.id = $1 AND (
          mr.requested_by = $2 OR
          mr.status IN ('submitted', 'under_review', 'approved', 'rejected')
        )
      `;
      queryParams.push(userId);
    } else {
      // Leaders, accounting can see all requests (with different conditions in main API)
      materialRequestQuery = `
        SELECT mr.*, p.title as project_title, p.project_number,
               c.company_name as customer_name, u.name as requested_by_name
        FROM material_requests mr
        LEFT JOIN projects p ON mr.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN auth_users u ON mr.requested_by = u.id
        WHERE mr.id = $1
      `;
    }

    console.log("GET /api/material-requests/[id] - Executing query");
    const materialRequestResult = await sql(materialRequestQuery, queryParams);

    if (materialRequestResult.length === 0) {
      console.error("GET /api/material-requests/[id] - Not found", {
        id,
        userId,
        userRole,
      });
      return new Response(
        JSON.stringify({
          error:
            "Material request not found or you don't have permission to view it",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const materialRequest = materialRequestResult[0];
    console.log("GET /api/material-requests/[id] - Found request", {
      id: materialRequest.id,
    });

    // Get material request items
    const itemsResult = await sql`
      SELECT mri.*, m.name as material_name, m.part_number, m.unit_type as material_unit_type
      FROM material_request_items mri
      LEFT JOIN materials m ON mri.material_id = m.id
      WHERE mri.material_request_id = ${id}
      ORDER BY mri.item_order, mri.id
    `;
    console.log("GET /api/material-requests/[id] - Found items", {
      count: itemsResult.length,
    });

    // Get approval workflow
    const approvalResult = await sql`
      SELECT aw.*, u.name as approver_name
      FROM approval_workflows aw
      LEFT JOIN auth_users u ON aw.approver_id = u.id
      WHERE aw.material_request_id = ${id}
      ORDER BY aw.step_order
    `;
    console.log("GET /api/material-requests/[id] - Found approvals", {
      count: approvalResult.length,
    });

    const response = {
      material_request: {
        ...materialRequest,
        items: itemsResult || [],
        approval_workflow: approvalResult || [],
      },
    };

    console.log("GET /api/material-requests/[id] - Success");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /api/material-requests/[id] error", err);
    console.error("Error stack:", err.stack);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const userId = session.user.id;
    const body = await request.json();

    // Get user role
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    // Get current material request
    const currentRequestResult = await sql`
      SELECT * FROM material_requests WHERE id = ${id} LIMIT 1
    `;

    if (currentRequestResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "Material request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const currentRequest = currentRequestResult[0];

    // Check permissions based on action
    const { action, ...updateData } = body;

    if (action === "update_item") {
      // Engineers can update items in their own draft requests
      // Sales can update items in submitted requests during review
      // Leaders can update items in under_review requests during approval, or draft requests they can access
      if (
        (userRole === "engineer" &&
          (currentRequest.requested_by !== userId ||
            currentRequest.status !== "draft")) ||
        (userRole === "sales" && currentRequest.status !== "submitted") ||
        (userRole === "leader" &&
          currentRequest.status !== "under_review" &&
          currentRequest.status !== "draft") ||
        userRole === "accounting"
      ) {
        return new Response(JSON.stringify({ error: "Permission denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { item_data, item_index } = updateData;

      // Get current items
      const currentItemsResult = await sql`
        SELECT * FROM material_request_items 
        WHERE material_request_id = ${id} 
        ORDER BY item_order, id
      `;

      let items = [...currentItemsResult];

      if (item_index === -1) {
        // Add new item
        const newItem = {
          ...item_data,
          estimated_total_cost:
            (item_data.quantity || 1) * (item_data.estimated_unit_cost || 0),
          item_order: items.length + 1,
        };

        await sql`
          INSERT INTO material_request_items (
            material_request_id, material_id, description, quantity, unit_type,
            estimated_unit_cost, estimated_total_cost, purpose, is_urgent, item_order
          )
          VALUES (
            ${id}, ${newItem.material_id || null}, ${newItem.description},
            ${newItem.quantity || 1}, ${newItem.unit_type || "Unit"},
            ${newItem.estimated_unit_cost || 0}, ${newItem.estimated_total_cost},
            ${newItem.purpose || null}, ${newItem.is_urgent || false}, ${newItem.item_order}
          )
        `;
      } else if (item_index >= 0 && item_index < items.length) {
        // Update existing item
        const itemToUpdate = items[item_index];
        const updatedItem = {
          ...item_data,
          estimated_total_cost:
            (item_data.quantity || 1) * (item_data.estimated_unit_cost || 0),
        };

        await sql`
          UPDATE material_request_items 
          SET material_id = ${updatedItem.material_id || null},
              description = ${updatedItem.description},
              quantity = ${updatedItem.quantity || 1},
              unit_type = ${updatedItem.unit_type || "Unit"},
              estimated_unit_cost = ${updatedItem.estimated_unit_cost || 0},
              estimated_total_cost = ${updatedItem.estimated_total_cost},
              purpose = ${updatedItem.purpose || null},
              is_urgent = ${updatedItem.is_urgent || false}
          WHERE id = ${itemToUpdate.id}
        `;
      } else {
        return new Response(JSON.stringify({ error: "Invalid item index" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Recalculate total cost
      const updatedItemsResult = await sql`
        SELECT estimated_total_cost FROM material_request_items 
        WHERE material_request_id = ${id}
      `;

      const newTotalCost = updatedItemsResult.reduce(
        (sum, item) => sum + parseFloat(item.estimated_total_cost || 0),
        0,
      );

      // Update material request total cost
      await sql`
        UPDATE material_requests 
        SET estimated_total_cost = ${newTotalCost}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;
    } else if (action === "delete_item") {
      // Engineers can delete items in their own draft requests
      // Sales can delete items in submitted requests during review
      // Leaders can delete items in under_review requests during approval, or draft requests they can access
      if (
        (userRole === "engineer" &&
          (currentRequest.requested_by !== userId ||
            currentRequest.status !== "draft")) ||
        (userRole === "sales" && currentRequest.status !== "submitted") ||
        (userRole === "leader" &&
          currentRequest.status !== "under_review" &&
          currentRequest.status !== "draft") ||
        userRole === "accounting"
      ) {
        return new Response(JSON.stringify({ error: "Permission denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { item_index } = updateData;

      // Get current items
      const currentItemsResult = await sql`
        SELECT * FROM material_request_items 
        WHERE material_request_id = ${id} 
        ORDER BY item_order, id
      `;

      let items = [...currentItemsResult];

      if (item_index >= 0 && item_index < items.length) {
        // Delete the item
        const itemToDelete = items[item_index];
        await sql`
          DELETE FROM material_request_items 
          WHERE id = ${itemToDelete.id}
        `;

        // Reorder remaining items
        const remainingItems = items.filter((_, idx) => idx !== item_index);
        for (let i = 0; i < remainingItems.length; i++) {
          await sql`
            UPDATE material_request_items 
            SET item_order = ${i + 1}
            WHERE id = ${remainingItems[i].id}
          `;
        }
      } else {
        return new Response(JSON.stringify({ error: "Invalid item index" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Recalculate total cost
      const updatedItemsResult = await sql`
        SELECT estimated_total_cost FROM material_request_items 
        WHERE material_request_id = ${id}
      `;

      const newTotalCost = updatedItemsResult.reduce(
        (sum, item) => sum + parseFloat(item.estimated_total_cost || 0),
        0,
      );

      // Update material request total cost
      await sql`
        UPDATE material_requests 
        SET estimated_total_cost = ${newTotalCost}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;
    } else if (action === "submit") {
      // Engineers and sales can submit their own requests
      if (
        (userRole !== "engineer" && userRole !== "sales") ||
        currentRequest.requested_by !== userId
      ) {
        return new Response(JSON.stringify({ error: "Permission denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (currentRequest.status !== "draft") {
        return new Response(
          JSON.stringify({ error: "Can only submit draft requests" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Update status to submitted and create approval workflow
      await sql`
        UPDATE material_requests 
        SET status = 'submitted', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;

      // Create approval workflow steps
      // Step 1: Sales review
      await sql`
        INSERT INTO approval_workflows (material_request_id, step_order, approver_role, status)
        VALUES (${id}, 1, 'sales', 'pending')
      `;

      // Step 2: Leader approval
      await sql`
        INSERT INTO approval_workflows (material_request_id, step_order, approver_role, status)
        VALUES (${id}, 2, 'leader', 'pending')
      `;
    } else if (action === "review") {
      // Only sales can review
      if (userRole !== "sales") {
        return new Response(
          JSON.stringify({ error: "Only sales can review requests" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      if (currentRequest.status !== "submitted") {
        return new Response(
          JSON.stringify({ error: "Request must be submitted to review" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const { approve, comments } = updateData;

      // Update material request status
      const newStatus = approve ? "under_review" : "rejected";
      await sql`
        UPDATE material_requests 
        SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;

      // Update sales approval step
      await sql`
        UPDATE approval_workflows 
        SET status = ${approve ? "approved" : "rejected"}, 
            approver_id = ${userId},
            comments = ${comments || null},
            approved_at = CURRENT_TIMESTAMP
        WHERE material_request_id = ${id} AND step_order = 1
      `;
    } else if (action === "approve" || action === "reject") {
      // Only leaders can do final approval
      if (userRole !== "leader") {
        return new Response(
          JSON.stringify({ error: "Only leaders can approve/reject requests" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      if (currentRequest.status !== "under_review") {
        return new Response(
          JSON.stringify({
            error: "Request must be under review for approval",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const { comments } = updateData;
      const finalStatus = action === "approve" ? "approved" : "rejected";

      // Update material request status
      await sql`
        UPDATE material_requests 
        SET status = ${finalStatus}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;

      // Update leader approval step
      await sql`
        UPDATE approval_workflows 
        SET status = ${finalStatus}, 
            approver_id = ${userId},
            comments = ${comments || null},
            approved_at = CURRENT_TIMESTAMP
        WHERE material_request_id = ${id} AND step_order = 2
      `;
    } else if (action === "direct_approve") {
      // Only sales and leaders can directly approve
      if (userRole !== "sales" && userRole !== "leader") {
        return new Response(
          JSON.stringify({
            error: "Only sales and leaders can directly approve requests",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      // Direct approve can work on draft, submitted, or under_review requests
      if (
        currentRequest.status !== "draft" &&
        currentRequest.status !== "submitted" &&
        currentRequest.status !== "under_review"
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Request must be in draft, submitted, or under_review status",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Update material request status to approved
      await sql`
        UPDATE material_requests 
        SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;

      // Create or update approval workflow steps
      // First check if approval workflow exists
      const existingApprovalResult = await sql`
        SELECT * FROM approval_workflows 
        WHERE material_request_id = ${id} 
        ORDER BY step_order
      `;

      if (existingApprovalResult.length === 0) {
        // Create approval workflow steps if they don't exist
        await sql`
          INSERT INTO approval_workflows (material_request_id, step_order, approver_role, approver_id, status, approved_at)
          VALUES (${id}, 1, 'sales', ${userRole === "sales" ? userId : null}, 'approved', CURRENT_TIMESTAMP)
        `;

        await sql`
          INSERT INTO approval_workflows (material_request_id, step_order, approver_role, approver_id, status, approved_at)
          VALUES (${id}, 2, 'leader', ${userRole === "leader" ? userId : null}, 'approved', CURRENT_TIMESTAMP)
        `;
      } else {
        // Update existing workflow steps to approved
        await sql`
          UPDATE approval_workflows 
          SET status = 'approved',
              approver_id = ${userId},
              approved_at = CURRENT_TIMESTAMP
          WHERE material_request_id = ${id}
        `;
      }
    } else {
      // Regular update - engineers and sales can update their own draft requests
      if (
        (userRole !== "engineer" && userRole !== "sales") ||
        currentRequest.requested_by !== userId
      ) {
        return new Response(JSON.stringify({ error: "Permission denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (currentRequest.status !== "draft") {
        return new Response(
          JSON.stringify({ error: "Can only edit draft requests" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Update material request
      const {
        title,
        description,
        urgency,
        needed_date,
        items = [],
      } = updateData;

      // Calculate new estimated total cost
      let estimated_total_cost = 0;
      for (const item of items) {
        estimated_total_cost +=
          parseFloat(item.quantity || 0) *
          parseFloat(item.estimated_unit_cost || 0);
      }

      await sql`
        UPDATE material_requests 
        SET title = ${title || currentRequest.title},
            description = ${description !== undefined ? description : currentRequest.description},
            urgency = ${urgency || currentRequest.urgency},
            needed_date = ${needed_date !== undefined ? needed_date : currentRequest.needed_date},
            estimated_total_cost = ${estimated_total_cost},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      // Delete existing items and insert new ones
      if (items.length > 0) {
        await sql`DELETE FROM material_request_items WHERE material_request_id = ${id}`;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const item_total_cost =
            parseFloat(item.quantity || 0) *
            parseFloat(item.estimated_unit_cost || 0);

          await sql`
            INSERT INTO material_request_items (
              material_request_id, material_id, description, quantity, unit_type,
              estimated_unit_cost, estimated_total_cost, purpose, is_urgent, item_order
            )
            VALUES (
              ${id}, ${item.material_id || null}, ${item.description},
              ${item.quantity || 1}, ${item.unit_type || "Unit"},
              ${item.estimated_unit_cost || 0}, ${item_total_cost},
              ${item.purpose || null}, ${item.is_urgent || false}, ${i + 1}
            )
          `;
        }
      }
    }

    // Return updated material request
    const updatedResult = await sql`
      SELECT mr.*, p.title as project_title, p.project_number,
             c.company_name as customer_name, u.name as requested_by_name
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE mr.id = ${id}
    `;

    // Get updated items
    const itemsResult = await sql`
      SELECT mri.*, m.name as material_name, m.part_number, m.unit_type as material_unit_type
      FROM material_request_items mri
      LEFT JOIN materials m ON mri.material_id = m.id
      WHERE mri.material_request_id = ${id}
      ORDER BY mri.item_order, mri.id
    `;

    // Get approval workflow
    const approvalResult = await sql`
      SELECT aw.*, u.name as approver_name
      FROM approval_workflows aw
      LEFT JOIN auth_users u ON aw.approver_id = u.id
      WHERE aw.material_request_id = ${id}
      ORDER BY aw.step_order
    `;

    return new Response(
      JSON.stringify({
        material_request: {
          ...updatedResult[0],
          items: itemsResult || [],
          approval_workflow: approvalResult || [],
        },
        message: action
          ? `Request ${action}ed successfully`
          : "Request updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("PUT /api/material-requests/[id] error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const userId = session.user.id;

    // Get user role and material request
    const userResult = await sql`
      SELECT user_role FROM auth_users WHERE id = ${userId} LIMIT 1
    `;
    const userRole = userResult[0]?.user_role || "engineer";

    const materialRequestResult = await sql`
      SELECT * FROM material_requests WHERE id = ${id} LIMIT 1
    `;

    if (materialRequestResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "Material request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const materialRequest = materialRequestResult[0];

    // Engineers and sales can delete their own draft requests, or leaders can delete any
    if (
      (userRole === "engineer" || userRole === "sales") &&
      materialRequest.requested_by !== userId
    ) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      (userRole === "engineer" || userRole === "sales") &&
      materialRequest.status !== "draft"
    ) {
      return new Response(
        JSON.stringify({ error: "Can only delete draft requests" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (
      userRole !== "engineer" &&
      userRole !== "sales" &&
      userRole !== "leader"
    ) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete material request (cascade will handle items and workflow)
    await sql`DELETE FROM material_requests WHERE id = ${id}`;

    return new Response(
      JSON.stringify({ message: "Material request deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("DELETE /api/material-requests/[id] error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
