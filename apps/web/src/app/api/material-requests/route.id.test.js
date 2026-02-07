import {
  describe as baseDescribe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import sql from "@/app/api/utils/sql";

const HAS_DB = !!process.env.DATABASE_URL;
const describe = HAS_DB ? baseDescribe : baseDescribe.skip;

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";
import { GET, PUT } from "./[id]/route";

// Helpers to create minimal test data
async function ensureLeaderUser() {
  const rows = await sql(`
    WITH new_user AS (
      INSERT INTO public.auth_users (name, email, user_role)
      SELECT 'Test Leader', 'test.leader@example.com', 'leader'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.auth_users WHERE email = 'test.leader@example.com'
      )
      RETURNING id
    ),
    existing AS (
      SELECT id FROM public.auth_users WHERE email = 'test.leader@example.com' LIMIT 1
    )
    SELECT id FROM new_user
    UNION ALL
    SELECT id FROM existing
    LIMIT 1;
  `);
  return rows[0].id;
}

async function createBasicGraph(userId) {
  const customer = await sql`
    INSERT INTO public.customers (company_name, contact_name, email)
    VALUES ('Test Company for MR', 'QC', 'test.mr@example.com')
    RETURNING id
  `;

  const project = await sql`
    INSERT INTO public.projects (project_number, customer_id, title, description, status)
    VALUES ('PRJ-TEST-MR', ${customer[0].id}, 'Test Project', 'For MR tests', 'planning')
    RETURNING id
  `;

  const material = await sql`
    INSERT INTO public.materials (name, description, category, unit_type, unit_cost, supplier, part_number)
    VALUES ('Test Bolt', 'A test bolt', 'Hardware', 'pcs', 5.50, 'Acme', 'TB-001')
    RETURNING id
  `;

  const mr = await sql`
    INSERT INTO public.material_requests (
      project_id, requested_by, request_type, title, description, urgency, estimated_total_cost, status
    ) VALUES (
      ${project[0].id}, ${userId}, 'material', 'Test MR', 'Preparing test MR', 'medium', 0, 'draft'
    ) RETURNING id
  `;

  const item = await sql`
    INSERT INTO public.material_request_items (
      material_request_id, material_id, description, quantity, unit_type, estimated_unit_cost, estimated_total_cost, purpose, is_urgent, item_order
    ) VALUES (
      ${mr[0].id}, ${material[0].id}, 'Bolt item', 2, 'pcs', 5.50, 11.00, 'Assembly', false, 1
    ) RETURNING id
  `;

  // Create two workflow steps (sales + leader)
  await sql`
    INSERT INTO public.approval_workflows (material_request_id, step_order, approver_role, status)
    VALUES (${mr[0].id}, 1, 'sales', 'pending')
  `;
  await sql`
    INSERT INTO public.approval_workflows (material_request_id, step_order, approver_role, status)
    VALUES (${mr[0].id}, 2, 'leader', 'pending')
  `;

  return {
    customerId: customer[0].id,
    projectId: project[0].id,
    materialId: material[0].id,
    mrId: mr[0].id,
    itemId: item[0].id,
  };
}

async function cleanupGraph(ids) {
  if (!ids) return;
  await sql`DELETE FROM public.approval_workflows WHERE material_request_id = ${ids.mrId}`;
  await sql`DELETE FROM public.material_request_items WHERE material_request_id = ${ids.mrId}`;
  await sql`DELETE FROM public.material_requests WHERE id = ${ids.mrId}`;
  await sql`DELETE FROM public.materials WHERE id = ${ids.materialId}`;
  await sql`DELETE FROM public.projects WHERE id = ${ids.projectId}`;
  await sql`DELETE FROM public.customers WHERE id = ${ids.customerId}`;
}

describe("Material Requests API [id]", () => {
  let userId;
  let graph;

  beforeAll(async () => {
    userId = await ensureLeaderUser();
    graph = await createBasicGraph(userId);
    auth.mockResolvedValue({ user: { id: userId } });
  });

  afterAll(async () => {
    await cleanupGraph(graph);
  });

  it("GET returns material request with items and workflow", async () => {
    const req = new Request(
      "http://localhost:4000/api/material-requests/" + graph.mrId,
    );
    const res = await GET(req, { params: { id: String(graph.mrId) } });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.material_request).toBeTruthy();
    expect(data.material_request.id).toBe(graph.mrId);
    expect(Array.isArray(data.material_request.items)).toBe(true);
    expect(Array.isArray(data.material_request.approval_workflow)).toBe(true);
    expect(data.material_request.items.length).toBe(1);
    expect(data.material_request.approval_workflow.length).toBe(2);
  });

  it("PUT update_item updates item and recalculates total", async () => {
    const body = {
      action: "update_item",
      item_index: 0,
      item_data: {
        description: "Updated item",
        quantity: 3,
        unit_type: "pcs",
        estimated_unit_cost: 10.25,
        is_urgent: false,
      },
    };

    const req = new Request(
      "http://localhost:4000/api/material-requests/" + graph.mrId,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const res = await PUT(req, { params: { id: String(graph.mrId) } });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.material_request).toBeTruthy();
    const items = data.material_request.items;
    expect(items.length).toBe(1);

    const q = Number(items[0].quantity);
    const p = Number(items[0].estimated_unit_cost);
    const line = Number(items[0].estimated_total_cost);
    const parentTotal = Number(data.material_request.estimated_total_cost);

    expect(q).toBe(3);
    expect(p).toBeCloseTo(10.25, 2);
    expect(line).toBeCloseTo(30.75, 2);
    expect(parentTotal).toBeCloseTo(30.75, 2);
  });
});
