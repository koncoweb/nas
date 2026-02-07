import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig, verifyAuth, type AuthConfig } from '@hono/auth-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { hash, verify } from 'argon2';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import ws from 'ws';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { migrations } from '../src/app/api/utils/migrations.js';
neonConfig.webSocketConstructor = ws;

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = NeonAdapter(pool);

// Define extended user type for Auth.js
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  user_role?: string;
}

// Type augmentation for Auth.js
declare module '@auth/core/types' {
  interface User {
    user_role?: string;
  }
}

const app = new Hono<{
  Variables: {
    user: ExtendedUser | null;
    session: any;
  };
}>();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024, // 4.5mb to match vercel limit
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

if (process.env.AUTH_SECRET) {
  const authConfig: AuthConfig = {
    secret: process.env.AUTH_SECRET,
    adapter,
    pages: {
      signIn: '/account/signin',
      signOut: '/account/logout',
    },
    skipCSRFCheck,
    session: {
      strategy: 'database',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
      session({ session, user }) {
        if (user?.id) {
          session.user.id = user.id;
          // Type assertion for user_role since we extended the types
          session.user.user_role = (user as any).user_role;
        }
        return session;
      },
      jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id;
          // Type assertion for user_role since we extended the types  
          token.user_role = (user as any).user_role;
        }
        return token;
      },
    },
    providers: [
      Credentials({
        id: 'credentials-signin',
        name: 'Credentials Sign in',
        credentials: {
          email: {
            label: 'Email',
            type: 'email',
          },
          password: {
            label: 'Password',
            type: 'password',
          },
        },
        authorize: async (credentials) => {
          const { email, password } = credentials;
          if (!email || !password) {
            return null;
          }
          if (typeof email !== 'string' || typeof password !== 'string') {
            return null;
          }

          // Get user with accounts
          const user = await adapter.getUserByEmail(email);
          if (!user) {
            return null;
          }
          
          const matchingAccount = user.accounts.find(
            (account) => account.provider === 'credentials'
          );
          const accountPassword = matchingAccount?.password;
          if (!accountPassword) {
            return null;
          }

          const isValid = await verify(accountPassword, password);
          if (!isValid) {
            return null;
          }

          // Return user with role
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            user_role: user.user_role,
          };
        },
      }),
      Credentials({
        id: 'credentials-signup',
        name: 'Credentials Sign up',
        credentials: {
          email: {
            label: 'Email',
            type: 'email',
          },
          password: {
            label: 'Password',
            type: 'password',
          },
          name: { label: 'Name', type: 'text' },
          image: { label: 'Image', type: 'text', required: false },
        },
        authorize: async (credentials) => {
          const { email, password, name, image } = credentials;
          if (!email || !password) {
            return null;
          }
          if (typeof email !== 'string' || typeof password !== 'string') {
            return null;
          }

          // Check if user already exists
          const existingUser = await adapter.getUserByEmail(email);
          if (existingUser) {
            return null; // User already exists
          }

          // Create new user
          const newUser = await adapter.createUser({
            name: typeof name === 'string' && name.length > 0 ? name : undefined,
            email,
            emailVerified: null,
            image: typeof image === 'string' && image.length > 0 ? image : undefined,
          });

          // Create credentials account
          await adapter.linkAccount({
            userId: newUser.id,
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: newUser.id.toString(),
            extraData: { password: await hash(password) },
          });

          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            image: newUser.image,
            user_role: (newUser as any).user_role || 'sales',
          };
        },
      }),
    ],
  };

  // Initialize Auth.js configuration (but don't use the handler due to compatibility issues)
  app.use('*', initAuthConfig(() => authConfig));
}

app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

// Custom session endpoint that works with our authentication
app.get('/api/auth/session', async (c) => {
  try {
    // Get session token from cookie
    const cookies = c.req.header('cookie') || '';
    const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
    const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null;

    if (!sessionToken) {
      return c.json({ user: null });
    }

    // Get session and user from database
    const sessionData = await adapter.getSessionAndUser(sessionToken);
    if (!sessionData) {
      return c.json({ user: null });
    }

    // Check if session is expired
    if (sessionData.session.expires < new Date()) {
      // Clean up expired session
      await adapter.deleteSession(sessionToken);
      return c.json({ user: null });
    }

    return c.json({
      user: {
        id: sessionData.user.id,
        name: sessionData.user.name,
        email: sessionData.user.email,
        image: sessionData.user.image,
        user_role: sessionData.user.user_role
      },
      expires: sessionData.session.expires.toISOString()
    });
  } catch (error) {
    console.error('Session endpoint error:', error);
    return c.json({ user: null });
  }
});

// Custom providers endpoint
app.get('/api/auth/providers', async (c) => {
  return c.json({
    'credentials-signin': {
      id: 'credentials-signin',
      name: 'Credentials Sign in',
      type: 'credentials',
      signinUrl: '/api/auth/signin/credentials-signin',
      callbackUrl: '/api/auth/callback/credentials-signin'
    }
  });
});

// Custom signin endpoint that handles the form submission
app.post('/api/auth/signin/credentials-signin', async (c) => {
  try {
    const formData = await c.req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const callbackUrl = c.req.query('callbackUrl') || '/';

    if (!email || !password) {
      return c.redirect(`/account/signin?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    // Get user with accounts
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      return c.redirect(`/account/signin?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    
    const matchingAccount = user.accounts.find(
      (account) => account.provider === 'credentials'
    );
    const accountPassword = matchingAccount?.password;
    if (!accountPassword) {
      return c.redirect(`/account/signin?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    const isValid = await verify(accountPassword, password);
    if (!isValid) {
      return c.redirect(`/account/signin?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }

    // Create session
    const sessionToken = globalThis.crypto?.randomUUID?.() || 
                        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    if (adapter.createSession) {
      await adapter.createSession({
        sessionToken,
        userId: user.id,
        expires
      });
    }

    // Set session cookie
    c.header('Set-Cookie', `next-auth.session-token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
    
    // Redirect to callback URL
    return c.redirect(callbackUrl);
  } catch (error) {
    console.error('Signin error:', error);
    const callbackUrl = c.req.query('callbackUrl') || '/';
    return c.redirect(`/account/signin?error=Configuration&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
});

// Custom signout endpoint
app.post('/api/auth/signout', async (c) => {
  try {
    // Get session token from cookie
    const cookies = c.req.header('cookie') || '';
    const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
    const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null;

    if (sessionToken) {
      // Delete session from database
      await adapter.deleteSession(sessionToken);
    }

    // Clear session cookie
    c.header('Set-Cookie', 'next-auth.session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    
    // Return success or redirect
    const callbackUrl = c.req.query('callbackUrl') || '/account/signin';
    return c.redirect(callbackUrl);
  } catch (error) {
    console.error('Signout error:', error);
    return c.redirect('/account/signin');
  }
});

// Add session verification middleware for protected routes
app.use('/api/*', async (c, next) => {
  // Skip auth routes and test routes
  if (c.req.path.startsWith('/api/auth/') || 
      c.req.path === '/api/test' || 
      c.req.path === '/api/test-db') {
    return next();
  }
  
  // Get session token from cookie
  const cookies = c.req.header('cookie') || '';
  const sessionTokenMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
  const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null;

  if (sessionToken) {
    try {
      // Get session and user from database
      const sessionData = await adapter.getSessionAndUser(sessionToken);
      if (sessionData && sessionData.session.expires > new Date()) {
        // Set user and session in context
        c.set('user', sessionData.user);
        c.set('session', {
          user: sessionData.user,
          expires: sessionData.session.expires
        });
      }
    } catch (error) {
      console.error('Session verification error:', error);
    }
  }
  
  return next();
});
// Temporarily disable route builder due to import issues
// app.route(API_BASENAME, api);

// Manual route for testing
app.get('/api/test', async (c) => {
  return c.json({
    success: true,
    message: 'API route is working!',
    timestamp: new Date().toISOString(),
    database_url: process.env.DATABASE_URL ? 'Connected' : 'Not configured'
  });
});

// Profile endpoint
app.get('/api/profile', async (c) => {
  try {
    const session = c.get('session');
    
    if (!session || !session.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const rows = await pool.query(`
      SELECT id, name, email, image, user_role 
      FROM auth_users 
      WHERE id = $1 
      LIMIT 1
    `, [userId]);

    const user = rows.rows?.[0] || null;
    return c.json({ user });
  } catch (err) {
    console.error("GET /api/profile error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Test database connection
app.get('/api/test-db', async (c) => {
  try {
    const result = await pool.query('SELECT $1 as message, NOW() as timestamp', ['Database connection successful!']);
    return c.json({
      success: true,
      data: result.rows[0],
      database: 'Connected to Neon DB NAS2'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test costs table structure (temporary - remove after testing)
app.get('/api/test-costs-table', async (c) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM project_costs LIMIT 1');
    return c.json({
      success: true,
      message: 'Costs table exists',
      count: result.rows[0].count
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      message: 'Costs table might not exist or there is a database issue'
    }, 500);
  }
});

// Create project_costs table manually
app.post('/api/create-costs-table', async (c) => {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS project_costs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        cost_type VARCHAR(50) NOT NULL CHECK (
          cost_type IN ('labor', 'material', 'equipment', 'subcontractor', 'travel', 'other')
        ),
        description TEXT NOT NULL,
        material_id INTEGER REFERENCES materials(id),
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_cost DECIMAL(10,2) DEFAULT 0,
        total_cost DECIMAL(10,2) NOT NULL,
        purchase_date DATE,
        vendor VARCHAR(255),
        receipt_number VARCHAR(100),
        approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
          approval_status IN ('pending', 'approved', 'rejected')
        ),
        created_by INTEGER REFERENCES auth_users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_project_costs_project 
        ON project_costs(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_costs_type 
        ON project_costs(cost_type);
      CREATE INDEX IF NOT EXISTS idx_project_costs_status 
        ON project_costs(approval_status);
    `;
    
    await pool.query(createTableSQL);
    
    return c.json({
      success: true,
      message: 'Project costs table created successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test costs endpoint without auth (temporary)
app.get('/api/test-costs-no-auth', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url);
    const project_id = searchParams.get("project") || searchParams.get("project_id") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (project_id) {
      whereClause += " AND pc.project_id = $1";
      params.push(parseInt(project_id));
    }

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      ${whereClause}
    `;
    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0]?.total || 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    const listSql = `
      SELECT 
        pc.*, 
        p.project_number, p.title AS project_title
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      ${whereClause}
      ORDER BY pc.purchase_date DESC NULLS LAST, pc.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const rows = await pool.query(listSql, [...params, limit, offset]);

    return c.json({
      success: true,
      costs: rows.rows || [],
      pagination: { page, limit, total, pages },
      message: 'Costs API is working! (No auth test)'
    });
  } catch (err) {
    console.error("GET /api/test-costs-no-auth error", err);
    return c.json({ 
      success: false,
      error: "Internal Server Error",
      details: err.message 
    }, 500);
  }
});

// Fixed costs endpoint with proper authentication
app.get('/api/costs-fixed', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const search = searchParams.get("search") || "";
    const cost_type = searchParams.get("cost_type") || "";
    const project_id = searchParams.get("project_id") || "";
    const expense_type = (searchParams.get("expense_type") || "").toLowerCase();
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (search) {
      whereClause += ` AND (LOWER(pc.description) LIKE LOWER($${params.length + 1}) OR LOWER(pc.vendor) LIKE LOWER($${params.length + 1}) OR LOWER(pc.receipt_number) LIKE LOWER($${params.length + 1}))`;
      params.push(`%${search}%`);
    }
    if (cost_type) {
      whereClause += ` AND pc.cost_type = $${params.length + 1}`;
      params.push(cost_type);
    }
    if (project_id) {
      whereClause += ` AND pc.project_id = $${params.length + 1}`;
      params.push(parseInt(project_id));
    }
    if (expense_type === "project") {
      whereClause += ` AND pc.project_id IS NOT NULL`;
    } else if (expense_type === "operational") {
      whereClause += ` AND pc.project_id IS NULL`;
    }
    if (from) {
      whereClause += ` AND pc.purchase_date >= $${params.length + 1}`;
      params.push(from);
    }
    if (to) {
      whereClause += ` AND pc.purchase_date <= $${params.length + 1}`;
      params.push(to);
    }

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      ${whereClause}
    `;
    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0]?.total || 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    const listSql = `
      SELECT 
        pc.*, 
        p.project_number, p.title AS project_title
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      ${whereClause}
      ORDER BY pc.purchase_date DESC NULLS LAST, pc.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const rows = await pool.query(listSql, [...params, limit, offset]);

    return c.json({
      costs: rows.rows || [],
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error("GET /api/costs-fixed error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Fixed costs POST endpoint
app.post('/api/costs-fixed', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const roleRes = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const role = roleRes.rows[0]?.user_role || "sales";
    if (!["leader", "engineer", "accounting"].includes(role)) {
      return c.json({ error: "Permission denied" }, 403);
    }

    const body = await c.req.json();
    const {
      project_id = null,
      expense_type = null,
      category = null,
      cost_type,
      description,
      material_id = null,
      quantity = 1,
      unit_cost = 0,
      total_cost = null,
      purchase_date = null,
      vendor = null,
      receipt_number = null,
    } = body;

    if (!cost_type) {
      return c.json({ error: "cost_type is required" }, 400);
    }
    if (!description || !description.trim()) {
      return c.json({ error: "description is required" }, 400);
    }

    const isOperational =
      (expense_type || "").toLowerCase() === "operational" ||
      (!project_id && expense_type == null);
    if (!isOperational && !project_id) {
      return c.json(
        { error: "project_id is required for project expenses" },
        400,
      );
    }

    const qty = parseFloat(quantity || 1);
    const uCost = parseFloat(unit_cost || 0);
    const tCost = total_cost != null ? parseFloat(total_cost) : qty * uCost;

    const finalDescription =
      isOperational && category
        ? `[${String(category).toLowerCase()}] ${description.trim()}`
        : description.trim();

    const insertResult = await pool.query(
      `INSERT INTO project_costs (
        project_id, cost_type, description, material_id, quantity, unit_cost, total_cost,
        purchase_date, vendor, receipt_number, created_by, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [project_id ? parseInt(project_id) : null, cost_type, finalDescription, material_id ? parseInt(material_id) : null,
       qty, uCost, tCost, purchase_date, vendor, receipt_number, userId, 'pending']
    );

    return c.json({ cost: insertResult.rows[0], message: "Expense added" });
  } catch (err) {
    console.error("POST /api/costs-fixed error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Fixed costs GET by ID endpoint
app.get('/api/costs-fixed/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const costQuery = `
      SELECT 
        pc.*, 
        p.project_number, 
        p.title AS project_title,
        u.name as created_by_name
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      LEFT JOIN auth_users u ON pc.created_by = u.id
      WHERE pc.id = $1
    `;
    
    const result = await pool.query(costQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Cost not found' }, 404);
    }

    return c.json({ cost: result.rows[0] });
  } catch (error) {
    console.error('Error fetching cost:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Fixed costs PUT endpoint
app.put('/api/costs-fixed/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['cost_type', 'description', 'quantity', 'unit_cost', 'total_cost', 'purchase_date', 'vendor', 'receipt_number', 'approval_status'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE project_costs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Cost not found' }, 404);
    }

    return c.json({ cost: result.rows[0] });
  } catch (error) {
    console.error('Error updating cost:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Test what tables exist
app.get('/api/test-tables', async (c) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    // Also check if project_costs exists specifically
    const costsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_costs'
      );
    `);
    
    return c.json({
      success: true,
      tables: result.rows.map(row => row.table_name),
      project_costs_exists: costsCheck.rows[0].exists
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test auth session
app.get('/api/test-auth', async (c) => {
  try {
    const session = c.get('session');
    return c.json({
      success: true,
      session: session || null,
      message: session ? 'User authenticated' : 'No active session'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test login endpoint
app.post('/api/test-login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    // Get user with accounts
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const matchingAccount = user.accounts.find(
      (account) => account.provider === 'credentials'
    );
    const accountPassword = matchingAccount?.password;
    if (!accountPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await verify(accountPassword, password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create session using a simple UUID generator
    const sessionToken = globalThis.crypto?.randomUUID?.() || 
                        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    if (adapter.createSession) {
      await adapter.createSession({
        sessionToken,
        userId: user.id,
        expires
      });
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_role: user.user_role
      },
      sessionToken
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test role-based access
app.get('/api/test-roles', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = session.user;
    const roleHierarchy = {
      'leader': 4,
      'accounting': 3,
      'engineer': 2,
      'sales': 1
    };

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.user_role
      },
      roleLevel: roleHierarchy[user.user_role] || 0,
      permissions: {
        canViewAllProjects: ['leader', 'accounting'].includes(user.user_role),
        canCreateProjects: user.user_role === 'leader',
        canManageUsers: user.user_role === 'leader',
        canViewFinancials: ['leader', 'accounting'].includes(user.user_role),
        canApproveRequests: ['leader', 'accounting'].includes(user.user_role)
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Quotations API endpoints
app.get('/api/quotations', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (quote_number ILIKE $${paramIndex} OR title ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM quotations ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get quotations
    const quotationsQuery = `
      SELECT 
        id, quote_number, title, customer_name, service_type, 
        final_price, status, valid_until, created_at, updated_at
      FROM quotations 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const quotationsResult = await pool.query(quotationsQuery, [...params, limit, offset]);

    return c.json({
      quotations: quotationsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Projects API endpoints
app.get('/api/projects', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (project_number ILIKE $${paramIndex} OR title ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get projects
    const projectsQuery = `
      SELECT 
        id, project_number, title, customer_name, service_type, 
        total_value, status, start_date, end_date, created_at, updated_at
      FROM projects 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const projectsResult = await pool.query(projectsQuery, [...params, limit, offset]);

    return c.json({
      projects: projectsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Customers API endpoints
app.get('/api/customers', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (company_name ILIKE $${paramIndex} OR contact_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get customers
    const customersQuery = `
      SELECT 
        id, company_name as name, contact_name, email, phone, address, 
        created_at, updated_at
      FROM customers 
      ${whereClause}
      ORDER BY company_name ASC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const customersResult = await pool.query(customersQuery, [...params, limit, offset]);

    return c.json({
      customers: customersResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Materials API endpoints
app.get('/api/materials', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const category = c.req.query('category') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM materials ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get materials
    const materialsQuery = `
      SELECT 
        id, name, description, sku, category, unit, 
        unit_price, stock_quantity, created_at, updated_at
      FROM materials 
      ${whereClause}
      ORDER BY name ASC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const materialsResult = await pool.query(materialsQuery, [...params, limit, offset]);

    return c.json({
      materials: materialsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get basic stats from database
    const quotesResult = await pool.query('SELECT COUNT(*) as count FROM quotations');
    const projectsResult = await pool.query('SELECT COUNT(*) as count FROM projects WHERE status = $1', ['active']);
    const invoicesResult = await pool.query('SELECT COUNT(*) as count FROM invoices WHERE status = $1', ['pending']);
    
    // Calculate monthly revenue (this month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as revenue FROM invoices WHERE status = $1 AND created_at >= $2',
      ['paid', `${currentMonth}-01`]
    );

    return c.json({
      totalQuotes: parseInt(quotesResult.rows[0].count),
      activeProjects: parseInt(projectsResult.rows[0].count),
      pendingInvoices: parseInt(invoicesResult.rows[0].count),
      monthlyRevenue: parseFloat(revenueResult.rows[0].revenue)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values if there's an error
    return c.json({
      totalQuotes: 0,
      activeProjects: 0,
      pendingInvoices: 0,
      monthlyRevenue: 0
    });
  }
});

// Individual detail endpoints
// Get single quotation
app.get('/api/quotations/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const quotationQuery = `
      SELECT 
        q.*, 
        c.company_name as customer_company,
        c.contact_name as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = $1
    `;
    
    const result = await pool.query(quotationQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Quotation not found' }, 404);
    }

    return c.json({ quotation: result.rows[0] });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Get single project
app.get('/api/projects/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const projectQuery = `
      SELECT 
        p.*, 
        c.company_name as customer_company,
        c.contact_name as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        q.quote_number,
        q.final_price as quotation_amount
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN quotations q ON p.quotation_id = q.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(projectQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Get single customer
app.get('/api/customers/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const customerQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT q.id) as total_quotations,
        COUNT(DISTINCT p.id) as total_projects,
        COALESCE(SUM(q.final_price), 0) as total_quotation_value,
        COALESCE(SUM(p.total_value), 0) as total_project_value
      FROM customers c
      LEFT JOIN quotations q ON c.id = q.customer_id
      LEFT JOIN projects p ON c.id = p.customer_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await pool.query(customerQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    // Get recent quotations and projects
    const quotationsQuery = `
      SELECT id, quote_number, title, final_price, status, created_at
      FROM quotations 
      WHERE customer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const projectsQuery = `
      SELECT id, project_number, title, total_value, status, created_at
      FROM projects 
      WHERE customer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const quotationsResult = await pool.query(quotationsQuery, [id]);
    const projectsResult = await pool.query(projectsQuery, [id]);

    return c.json({ 
      customer: result.rows[0],
      recent_quotations: quotationsResult.rows,
      recent_projects: projectsResult.rows
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Get single material
app.get('/api/materials/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const materialQuery = `
      SELECT * FROM materials WHERE id = $1
    `;
    
    const result = await pool.query(materialQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Material not found' }, 404);
    }

    return c.json({ material: result.rows[0] });
  } catch (error) {
    console.error('Error fetching material:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update endpoints for PUT/PATCH operations
// Update quotation
app.put('/api/quotations/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['title', 'description', 'service_type', 'status', 'final_price', 'valid_until', 'notes', 'customer_name'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE quotations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Quotation not found' }, 404);
    }

    return c.json({ quotation: result.rows[0] });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update project
app.put('/api/projects/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['title', 'description', 'status', 'start_date', 'end_date', 'total_value', 'progress_percentage', 'notes'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Create new quotation
app.post('/api/quotations', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const userId = session.user.id;
    
    // Generate quote number
    const quoteNumberResult = await pool.query(
      'SELECT COUNT(*) as count FROM quotations WHERE quote_number LIKE $1',
      [`QUO-${new Date().getFullYear()}-%`]
    );
    const nextNumber = parseInt(quoteNumberResult.rows[0].count) + 1;
    const quoteNumber = `QUO-${new Date().getFullYear()}-${nextNumber.toString().padStart(3, '0')}`;

    const insertQuery = `
      INSERT INTO quotations (
        quote_number, customer_id, customer_name, title, description, 
        service_type, final_price, status, valid_until, vessel_name, 
        location, created_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      quoteNumber,
      body.customer_id || null,
      body.customer_name || '',
      body.title || '',
      body.description || '',
      body.service_type || '',
      body.final_price || 0,
      body.status || 'draft',
      body.valid_until || null,
      body.vessel_name || '',
      body.location || '',
      userId,
      body.notes || ''
    ];

    const result = await pool.query(insertQuery, values);
    return c.json({ quotation: result.rows[0] });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Create new project
app.post('/api/projects', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const userId = session.user.id;
    
    // Generate project number
    const projectNumberResult = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE project_number LIKE $1',
      [`PRJ-${new Date().getFullYear()}-%`]
    );
    const nextNumber = parseInt(projectNumberResult.rows[0].count) + 1;
    const projectNumber = `PRJ-${new Date().getFullYear()}-${nextNumber.toString().padStart(3, '0')}`;

    const insertQuery = `
      INSERT INTO projects (
        project_number, quotation_id, customer_id, customer_name, title, 
        description, service_type, status, start_date, end_date, total_value, 
        vessel_name, location, created_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      projectNumber,
      body.quotation_id || null,
      body.customer_id || null,
      body.customer_name || '',
      body.title || '',
      body.description || '',
      body.service_type || '',
      body.status || 'planning',
      body.start_date || null,
      body.end_date || null,
      body.total_value || 0,
      body.vessel_name || '',
      body.location || '',
      userId,
      body.notes || ''
    ];

    const result = await pool.query(insertQuery, values);
    return c.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Create new customer
app.post('/api/customers', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    const insertQuery = `
      INSERT INTO customers (
        company_name, name, contact_name, email, phone, address, city, state, zip_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      body.company_name || '',
      body.name || body.company_name || '',
      body.contact_name || '',
      body.email || '',
      body.phone || '',
      body.address || '',
      body.city || '',
      body.state || '',
      body.zip_code || ''
    ];

    const result = await pool.query(insertQuery, values);
    return c.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Error creating customer:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update customer
app.put('/api/customers/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['company_name', 'name', 'contact_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE customers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    return c.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Error updating customer:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Delete customer
app.delete('/api/customers/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    return c.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Delete endpoints
app.delete('/api/quotations/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const result = await pool.query('DELETE FROM quotations WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Quotation not found' }, 404);
    }

    return c.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.delete('/api/projects/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Test leader-only endpoint
app.get('/api/test-leader-only', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (session.user.user_role !== 'leader') {
      return c.json({ 
        error: 'Forbidden', 
        message: 'Only leaders can access this endpoint',
        yourRole: session.user.user_role
      }, 403);
    }

    return c.json({
      success: true,
      message: 'Welcome, Leader!',
      data: {
        totalUsers: 4,
        totalProjects: 0,
        totalRevenue: 0,
        pendingApprovals: 0
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test accounting/leader endpoint
app.get('/api/test-financial', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!['leader', 'accounting'].includes(session.user.user_role)) {
      return c.json({ 
        error: 'Forbidden', 
        message: 'Only leaders and accounting can access financial data',
        yourRole: session.user.user_role
      }, 403);
    }

    return c.json({
      success: true,
      message: 'Financial data access granted',
      data: {
        totalRevenue: 1500000,
        totalExpenses: 800000,
        profit: 700000,
        pendingInvoices: 5
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test invoices table endpoint
app.get('/api/test-invoices-table', async (c) => {
  try {
    // Test if invoices table exists
    const testQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'invoices'
    `;
    const result = await pool.query(testQuery);
    
    if (result.rows.length === 0) {
      return c.json({
        success: false,
        message: 'Invoices table does not exist',
        tables: []
      });
    }
    
    // If table exists, try to count records
    const countQuery = 'SELECT COUNT(*) as count FROM invoices';
    const countResult = await pool.query(countQuery);
    
    return c.json({
      success: true,
      message: 'Invoices table exists',
      recordCount: parseInt(countResult.rows[0]?.count || 0)
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Invoices API endpoints
app.get('/api/invoices', async (c) => {
  try {
    // Skip authentication for testing
    // const session = c.get('session');
    // if (!session || !session.user?.id) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    // Simple test query first
    const testQuery = 'SELECT COUNT(*) as count FROM invoices';
    const testResult = await pool.query(testQuery);
    
    return c.json({
      invoices: [],
      pagination: {
        page: 1,
        limit: 10,
        total: parseInt(testResult.rows[0]?.count || 0),
        pages: 0,
      },
      message: 'Invoices endpoint working - table has ' + (testResult.rows[0]?.count || 0) + ' records'
    });
  } catch (err) {
    console.error("GET /api/invoices error", err);
    return c.json({ error: "Internal Server Error: " + err.message }, 500);
  }
});

app.post('/api/invoices', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;

    // Get user role
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const userRole = userResult.rows[0]?.user_role || "sales";

    // Check permissions - leaders and accounting can create invoices
    if (!["leader", "accounting"].includes(userRole)) {
      return c.json({ error: "Permission denied" }, 403);
    }

    const body = await c.req.json();
    const {
      project_id = null,
      customer_id,
      issue_date,
      payment_terms = "Net 30",
      tax_rate = 0,
      notes = null,
      line_items = [],
    } = body;

    // Validate required fields
    if (!customer_id) {
      return c.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    if (!issue_date) {
      return c.json(
        { error: "Issue date is required" },
        { status: 400 },
      );
    }

    if (
      !line_items.length ||
      !line_items.some((item) => item.description && item.description.trim())
    ) {
      return c.json(
        { error: "At least one line item with description is required" },
        { status: 400 },
      );
    }

    // Verify customer exists
    const customerCheck = await pool.query(
      'SELECT id FROM customers WHERE id = $1 LIMIT 1',
      [parseInt(customer_id)]
    );

    if (!customerCheck.rows.length) {
      return c.json({ error: "Customer not found" }, 404);
    }

    // If project_id provided, verify it exists and belongs to this customer
    if (project_id) {
      const projectCheck = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND customer_id = $2 LIMIT 1',
        [parseInt(project_id), parseInt(customer_id)]
      );

      if (!projectCheck.rows.length) {
        return c.json(
          { error: "Project not found or doesn't belong to this customer" },
          { status: 404 },
        );
      }
    }

    // Calculate totals
    const subtotal = line_items.reduce((sum, item) => {
      return (
        sum + parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)
      );
    }, 0);

    const taxAmount = subtotal * (parseFloat(tax_rate || 0) / 100);
    const totalAmount = subtotal + taxAmount;

    // Calculate due date based on payment terms
    let dueDate = null;
    if (payment_terms === "Due on Receipt") {
      dueDate = issue_date;
    } else if (payment_terms.startsWith("Net ")) {
      const days = parseInt(payment_terms.replace("Net ", ""));
      const issueDateObj = new Date(issue_date);
      issueDateObj.setDate(issueDateObj.getDate() + days);
      dueDate = issueDateObj.toISOString().split("T")[0];
    }

    // Generate invoice number
    const yearMonth = new Date(issue_date)
      .toISOString()
      .slice(0, 7)
      .replace("-", "");
    const lastInvoiceResult = await pool.query(
      'SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY invoice_number DESC LIMIT 1',
      [`INV-${yearMonth}-%`]
    );

    let invoiceNumber;
    if (lastInvoiceResult.rows.length > 0) {
      const lastNumber = parseInt(
        lastInvoiceResult.rows[0].invoice_number.split("-").pop(),
      );
      invoiceNumber = `INV-${yearMonth}-${String(lastNumber + 1).padStart(3, "0")}`;
    } else {
      invoiceNumber = `INV-${yearMonth}-001`;
    }

    // Insert invoice
    const insertInvoiceQuery = `
      INSERT INTO invoices (
        invoice_number, project_id, customer_id, issue_date, due_date,
        subtotal, tax_rate, tax_amount, total_amount, balance_due,
        status, payment_terms, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const invoiceResult = await pool.query(insertInvoiceQuery, [
      invoiceNumber,
      project_id ? parseInt(project_id) : null,
      parseInt(customer_id),
      issue_date,
      dueDate,
      subtotal.toFixed(2),
      parseFloat(tax_rate || 0),
      taxAmount.toFixed(2),
      totalAmount.toFixed(2),
      totalAmount.toFixed(2),
      'draft',
      payment_terms,
      notes,
      userId
    ]);

    const invoiceId = invoiceResult.rows[0].id;

    // Insert line items
    const cleanedItems = line_items
      .map((item, i) => ({
        description: (item.description || "").trim(),
        quantity: parseFloat(item.quantity || 0),
        unit_price: parseFloat(item.unit_price || 0),
        line_order: i + 1,
      }))
      .filter((it) => it.description);

    for (const item of cleanedItems) {
      await pool.query(
        'INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, line_total, line_order) VALUES ($1, $2, $3, $4, $5, $6)',
        [invoiceId, item.description, item.quantity, item.unit_price, (item.quantity * item.unit_price), item.line_order]
      );
    }

    return c.json({
      invoice: invoiceResult.rows[0],
      message: "Invoice created successfully",
    });
  } catch (err) {
    console.error("POST /api/invoices error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get single invoice
app.get('/api/invoices/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const invoiceQuery = `
      SELECT 
        i.*, 
        c.company_name as customer_company,
        c.contact_name as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        p.project_number,
        p.title as project_title
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = $1
    `;
    
    const result = await pool.query(invoiceQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Get line items
    const lineItemsQuery = `
      SELECT * FROM invoice_line_items 
      WHERE invoice_id = $1 
      ORDER BY line_order ASC
    `;
    const lineItemsResult = await pool.query(lineItemsQuery, [id]);

    return c.json({ 
      invoice: result.rows[0],
      line_items: lineItemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update invoice
app.put('/api/invoices/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['status', 'payment_terms', 'notes', 'due_date'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE invoices 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    return c.json({ invoice: result.rows[0] });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Delete invoice
app.delete('/api/invoices/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    // Delete line items first
    await pool.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
    
    // Delete invoice
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    return c.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Material Requests API endpoints
app.get('/api/material-requests', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const project_id = searchParams.get("project_id") || "";

    const offset = (page - 1) * limit;

    // Get user role to determine access
    const userId = session.user.id;
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const userRole = userResult.rows[0]?.user_role || "engineer";

    // Base query conditions
    let whereConditions = ["1=1"];
    let queryParams = [];

    // Role-based access control
    if (userRole === "engineer") {
      // Engineers can only see their own requests
      whereConditions.push(`mr.requested_by = $${queryParams.length + 1}`);
      queryParams.push(userId);
    } else if (userRole === "sales") {
      // Sales can see their own requests AND all submitted requests that need review
      whereConditions.push(`(
        mr.requested_by = $${queryParams.length + 1} OR
        mr.status IN ('submitted', 'under_review', 'approved', 'rejected')
      )`);
      queryParams.push(userId);
    } else if (userRole === "leader") {
      // Leaders can see all requests
      // No additional filter needed
    } else if (userRole === "accounting") {
      // Accounting can see approved requests for cost tracking
      whereConditions.push(`mr.status = 'approved'`);
    }

    if (search) {
      whereConditions.push(`(
        LOWER(mr.title) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(mr.description) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(p.title) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(u.name) LIKE LOWER('%' || $${queryParams.length + 1} || '%')
      )`);
      queryParams.push(search);
    }

    if (status) {
      whereConditions.push(`mr.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (project_id) {
      whereConditions.push(`mr.project_id = $${queryParams.length + 1}`);
      queryParams.push(project_id);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get material requests with project and user info
    const requestsQuery = `
      SELECT 
        mr.*,
        p.title as project_title,
        p.project_number,
        c.company_name as customer_name,
        u.name as requested_by_name
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE ${whereClause}
      ORDER BY mr.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);
    const requests = await pool.query(requestsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || 0);

    return c.json({
      material_requests: requests.rows || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/material-requests error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post('/api/material-requests', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check user role - engineers, sales, and leaders can create material requests
    const userId = session.user.id;
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const userRole = userResult.rows[0]?.user_role || "engineer";

    if (
      userRole !== "engineer" &&
      userRole !== "sales" &&
      userRole !== "leader"
    ) {
      return c.json(
        {
          error:
            "Only engineers, sales, and leaders can create material requests",
        },
        403,
      );
    }

    const body = await c.req.json();
    const {
      project_id,
      request_type = "material",
      title,
      description,
      urgency = "medium",
      needed_date,
      items = [],
    } = body;

    if (!project_id || !title) {
      return c.json(
        { error: "Project ID and title are required" },
        400,
      );
    }

    // Verify project exists and user has access
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 LIMIT 1',
      [project_id]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Calculate estimated total cost
    let estimated_total_cost = 0;
    for (const item of items) {
      estimated_total_cost +=
        parseFloat(item.quantity || 0) *
        parseFloat(item.estimated_unit_cost || 0);
    }

    // Create material request
    const materialRequestResult = await pool.query(
      `INSERT INTO material_requests (
        project_id, requested_by, request_type, title, description,
        urgency, estimated_total_cost, needed_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [project_id, userId, request_type, title, description || null,
       urgency, estimated_total_cost, needed_date || null, 'draft']
    );

    const materialRequest = materialRequestResult.rows[0];

    // Insert material request items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const item_total_cost =
        parseFloat(item.quantity || 0) *
        parseFloat(item.estimated_unit_cost || 0);

      await pool.query(
        `INSERT INTO material_request_items (
          material_request_id, material_id, description, quantity, unit_type,
          estimated_unit_cost, estimated_total_cost, purpose, is_urgent, item_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [materialRequest.id, item.material_id || null, item.description,
         item.quantity || 1, item.unit_type || "Unit",
         item.estimated_unit_cost || 0, item_total_cost,
         item.purpose || null, item.is_urgent || false, i + 1]
      );
    }

    return c.json(
      { material_request: materialRequest },
      201,
    );
  } catch (err) {
    console.error("POST /api/material-requests error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get single material request
app.get('/api/material-requests/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const requestQuery = `
      SELECT 
        mr.*, 
        p.project_number,
        p.title as project_title,
        c.company_name as customer_name,
        u.name as requested_by_name
      FROM material_requests mr
      LEFT JOIN projects p ON mr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON mr.requested_by = u.id
      WHERE mr.id = $1
    `;
    
    const result = await pool.query(requestQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Material request not found' }, 404);
    }

    // Get request items
    const itemsQuery = `
      SELECT * FROM material_request_items 
      WHERE material_request_id = $1 
      ORDER BY item_order ASC
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    return c.json({ 
      material_request: result.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching material request:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Reports API endpoints
app.get('/api/reports', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const project_id = searchParams.get("project_id") || "";
    const type = searchParams.get("type") || ""; // optional filter by report_type
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let whereConditions = ["1=1"];
    let queryParams = [];

    if (search) {
      whereConditions.push(`(
        LOWER(pr.work_summary) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.materials_used) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.recommendations) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.customer_feedback) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.issues_encountered) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(pr.delivery_items) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(p.project_number) LIKE LOWER('%' || $${queryParams.length + 1} || '%') OR
        LOWER(p.title) LIKE LOWER('%' || $${queryParams.length + 1} || '%')
      )`);
      queryParams.push(search);
    }

    if (status) {
      whereConditions.push(`pr.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (project_id) {
      whereConditions.push(`pr.project_id = $${queryParams.length + 1}`);
      queryParams.push(parseInt(project_id));
    }

    if (type) {
      whereConditions.push(`pr.report_type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM project_reports pr
      LEFT JOIN projects p ON pr.project_id = p.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.total || 0);
    const pages = Math.ceil(total / limit);

    // Get reports with related data
    const reportsQuery = `
      SELECT 
        pr.*,
        p.project_number,
        p.title as project_title,
        c.company_name as customer_name,
        u.name as created_by_name
      FROM project_reports pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON pr.created_by = u.id
      WHERE ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const reports = await pool.query(reportsQuery, [...queryParams, limit, offset]);

    return c.json({
      reports: reports.rows || [],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("GET /api/reports error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post('/api/reports', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;

    // Get user role
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const userRole = userResult.rows[0]?.user_role || "engineer";

    // Check permissions - leaders, engineers, and sales can create reports
    if (!["leader", "engineer", "sales"].includes(userRole)) {
      return c.json({ error: "Permission denied" }, 403);
    }

    const body = await c.req.json();
    const {
      project_id,
      report_type = "work_done",
      completion_date,
      work_summary,
      materials_used = null,
      recommendations = null,
      customer_feedback = null,
      issues_encountered = null,
      // Delivery Order fields
      delivery_number = null,
      delivered_date = null,
      delivery_items = null,
      delivery_notes = null,
    } = body;

    // Validate required common fields
    if (!project_id) {
      return c.json(
        { error: "Project ID is required" },
        400,
      );
    }

    // Conditional validation by report type
    if (report_type === "work_done") {
      if (!work_summary || !work_summary.trim()) {
        return c.json(
          { error: "Work summary is required for Work Done report" },
          400,
        );
      }
      if (!completion_date) {
        return c.json(
          { error: "Completion date is required" },
          400,
        );
      }
    } else if (report_type === "delivery_order") {
      if (!delivered_date) {
        return c.json(
          { error: "Delivered date is required for Delivery Order" },
          400,
        );
      }
      if (!delivery_items || !String(delivery_items).trim()) {
        return c.json(
          { error: "Delivery items are required for Delivery Order" },
          400,
        );
      }
    } else {
      return c.json({ error: "Invalid report type" }, 400);
    }

    // Verify project exists
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 LIMIT 1',
      [parseInt(project_id)]
    );

    if (!projectCheck.rows.length) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Helper function to convert empty strings to null for dates
    const sanitizeDate = (dateValue) => {
      if (!dateValue || dateValue === "") return null;
      return dateValue;
    };

    // Map dates & generate number
    const finalCompletionDate = sanitizeDate(
      report_type === "delivery_order" ? delivered_date : completion_date,
    );

    // Generate report number if not provided
    let finalDocNumber = delivery_number;
    if (!finalDocNumber) {
      // Simple report number generation
      const reportCount = await pool.query(
        'SELECT COUNT(*) as count FROM project_reports WHERE report_type = $1',
        [report_type]
      );
      const nextNumber = parseInt(reportCount.rows[0].count) + 1;
      const prefix = report_type === "delivery_order" ? "DO" : "WDR";
      const yyyy = new Date().getFullYear();
      const mm = String(new Date().getMonth() + 1).padStart(2, "0");
      finalDocNumber = `${prefix}-${yyyy}${mm}-${nextNumber.toString().padStart(3, '0')}`;
    }

    // Build insert with sanitized dates
    const result = await pool.query(
      `INSERT INTO project_reports (
        project_id, created_by, report_type, completion_date, work_summary,
        materials_used, recommendations, customer_feedback, issues_encountered,
        delivery_number, delivered_date, delivery_items, delivery_notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [parseInt(project_id), userId, report_type, sanitizeDate(finalCompletionDate), work_summary || null,
       materials_used, recommendations, customer_feedback, issues_encountered,
       finalDocNumber, sanitizeDate(delivered_date), delivery_items, delivery_notes,
       'pending']
    );

    return c.json({
      report: result.rows[0],
      message: "Report created successfully",
    });
  } catch (err) {
    console.error("POST /api/reports error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get single report
app.get('/api/reports/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const reportQuery = `
      SELECT 
        pr.*, 
        p.project_number,
        p.title as project_title,
        c.company_name as customer_name,
        u.name as created_by_name
      FROM project_reports pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN auth_users u ON pr.created_by = u.id
      WHERE pr.id = $1
    `;
    
    const result = await pool.query(reportQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Report not found' }, 404);
    }

    return c.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error fetching report:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Database migrations endpoint
app.post('/api/migrations/run', async (c) => {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get already executed migrations
    const executedResult = await pool.query('SELECT id FROM migrations ORDER BY id');
    const executedIds = new Set(executedResult.rows.map(row => row.id));
    
    // Run pending migrations
    let executedCount = 0;
    for (const migration of migrations) {
      if (!executedIds.has(migration.id)) {
        console.log(`Running migration ${migration.id}: ${migration.name}`);
        
        // Execute migration SQL
        await pool.query(migration.sql);
        
        // Record migration as executed
        await pool.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
        
        executedCount++;
        console.log(`✓ Migration ${migration.id} completed`);
      }
    }
    
    // Create demo users with hashed passwords
    console.log('Creating demo users...');
    const hashedPassword = await hash('password123');
    
    const createUsersSQL = `
      -- Insert demo users if they don't exist
      INSERT INTO auth_users (id, name, email, user_role) VALUES 
        (1, 'Admin User', 'admin@nas2.com', 'leader'),
        (2, 'Accounting User', 'accounting@nas2.com', 'accounting'),
        (3, 'Engineer User', 'engineer@nas2.com', 'engineer'),
        (4, 'Sales User', 'sales@nas2.com', 'sales')
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await pool.query(createUsersSQL);
    
    // Create auth accounts for demo users with proper hashed passwords
    const createAccountsSQL = `
      INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password) VALUES
        (1, 'credentials', 'credentials', '1', $1),
        (2, 'credentials', 'credentials', '2', $1),
        (3, 'credentials', 'credentials', '3', $1),
        (4, 'credentials', 'credentials', '4', $1)
      ON CONFLICT ("userId", provider) DO UPDATE SET password = EXCLUDED.password;
    `;
    
    await pool.query(createAccountsSQL, [hashedPassword]);
    
    console.log('✓ Demo users created/updated');
    
    return c.json({
      success: true,
      message: `Database setup complete. Executed ${executedCount} new migrations and created demo users.`,
      executedMigrations: executedCount,
      totalMigrations: migrations.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({
      success: false,
      error: error.message,
      details: error.stack
    }, 500);
  }
});

// Costs API endpoints
app.get('/api/costs', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const search = searchParams.get("search") || "";
    const cost_type = searchParams.get("cost_type") || "";
    const project_id = searchParams.get("project_id") || "";
    const expense_type = (searchParams.get("expense_type") || "").toLowerCase(); // 'project' | 'operational'
    const from = searchParams.get("from") || ""; // purchase_date >= from
    const to = searchParams.get("to") || ""; // purchase_date <= to
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const whereClauses = ["1=1"];
    const values = [];

    if (search) {
      whereClauses.push(
        `(LOWER(pc.description) LIKE LOWER('%' || $${values.length + 1} || '%') OR LOWER(pc.vendor) LIKE LOWER('%' || $${values.length + 1} || '%') OR LOWER(pc.receipt_number) LIKE LOWER('%' || $${values.length + 1} || '%'))`,
      );
      values.push(search);
    }
    if (cost_type) {
      whereClauses.push(`pc.cost_type = $${values.length + 1}`);
      values.push(cost_type);
    }
    if (project_id) {
      whereClauses.push(`pc.project_id = $${values.length + 1}`);
      values.push(parseInt(project_id));
    }
    if (expense_type === "project") {
      whereClauses.push(`pc.project_id IS NOT NULL`);
    } else if (expense_type === "operational") {
      whereClauses.push(`pc.project_id IS NULL`);
    }
    if (from) {
      whereClauses.push(`pc.purchase_date >= $${values.length + 1}`);
      values.push(from);
    }
    if (to) {
      whereClauses.push(`pc.purchase_date <= $${values.length + 1}`);
      values.push(to);
    }

    const where = whereClauses.join(" AND ");

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      WHERE ${where}
    `;
    const countResult = await pool.query(countSql, values);
    const total = countResult.rows[0]?.total || 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    const listSql = `
      SELECT 
        pc.*, 
        p.project_number, p.title AS project_title
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      WHERE ${where}
      ORDER BY pc.purchase_date DESC NULLS LAST, pc.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const rows = await pool.query(listSql, [...values, limit, offset]);

    return c.json({
      costs: rows.rows || [],
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error("GET /api/costs error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post('/api/costs', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    const roleRes = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const role = roleRes.rows[0]?.user_role || "sales";
    if (!["leader", "engineer", "accounting"].includes(role)) {
      return c.json({ error: "Permission denied" }, 403);
    }

    const body = await c.req.json();
    const {
      project_id = null,
      expense_type = null, // 'project' | 'operational' (optional hint)
      category = null, // operational category (UI-level)
      cost_type, // 'labor' | 'material' | 'equipment' | 'subcontractor' | 'travel' | 'other'
      description,
      material_id = null,
      quantity = 1,
      unit_cost = 0,
      total_cost = null,
      purchase_date = null,
      vendor = null,
      receipt_number = null,
    } = body;

    if (!cost_type) {
      return c.json({ error: "cost_type is required" }, 400);
    }
    if (!description || !description.trim()) {
      return c.json(
        { error: "description is required" },
        400,
      );
    }

    // If explicit expense_type provided, enforce project requirement accordingly
    const isOperational =
      (expense_type || "").toLowerCase() === "operational" ||
      (!project_id && expense_type == null);
    if (!isOperational && !project_id) {
      return c.json(
        { error: "project_id is required for project expenses" },
        400,
      );
    }

    const qty = parseFloat(quantity || 1);
    const uCost = parseFloat(unit_cost || 0);
    const tCost = total_cost != null ? parseFloat(total_cost) : qty * uCost;

    // Persist UI category by prefixing description when operational and category provided
    const finalDescription =
      isOperational && category
        ? `[${String(category).toLowerCase()}] ${description.trim()}`
        : description.trim();

    const insertResult = await pool.query(
      `INSERT INTO project_costs (
        project_id, cost_type, description, material_id, quantity, unit_cost, total_cost,
        purchase_date, vendor, receipt_number, created_by, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [project_id ? parseInt(project_id) : null, cost_type, finalDescription, material_id ? parseInt(material_id) : null,
       qty, uCost, tCost, purchase_date, vendor, receipt_number, userId, 'pending']
    );

    return c.json({ cost: insertResult.rows[0], message: "Expense added" });
  } catch (err) {
    console.error("POST /api/costs error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get single cost
app.get('/api/costs/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const costQuery = `
      SELECT 
        pc.*, 
        p.project_number, 
        p.title AS project_title,
        u.name as created_by_name
      FROM project_costs pc
      LEFT JOIN projects p ON pc.project_id = p.id
      LEFT JOIN auth_users u ON pc.created_by = u.id
      WHERE pc.id = $1
    `;
    
    const result = await pool.query(costQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Cost not found' }, 404);
    }

    return c.json({ cost: result.rows[0] });
  } catch (error) {
    console.error('Error fetching cost:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update cost
app.put('/api/costs/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['cost_type', 'description', 'quantity', 'unit_cost', 'total_cost', 'purchase_date', 'vendor', 'receipt_number', 'approval_status'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE project_costs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Cost not found' }, 404);
    }

    return c.json({ cost: result.rows[0] });
  } catch (error) {
    console.error('Error updating cost:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Delete cost
app.delete('/api/costs/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const result = await pool.query('DELETE FROM project_costs WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Cost not found' }, 404);
    }

    return c.json({ message: 'Cost deleted successfully' });
  } catch (error) {
    console.error('Error deleting cost:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Materials API endpoints
app.get('/api/materials', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(c.req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build query dynamically based on filters
    let countQuery = "SELECT COUNT(*) as total FROM materials WHERE 1=1";
    let materialsQuery = "SELECT * FROM materials WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (search) {
      const searchCondition = ` AND (
        LOWER(name) LIKE LOWER($${paramIndex}) OR
        LOWER(description) LIKE LOWER($${paramIndex}) OR
        LOWER(part_number) LIKE LOWER($${paramIndex})
      )`;
      countQuery += searchCondition;
      materialsQuery += searchCondition;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      const categoryCondition = ` AND category = $${paramIndex}`;
      countQuery += categoryCondition;
      materialsQuery += categoryCondition;
      params.push(category);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);
    const pages = Math.ceil(total / limit);

    // Get materials with pagination
    materialsQuery += ` ORDER BY name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const materials = await pool.query(materialsQuery, [...params, limit, offset]);

    return c.json({
      materials: materials.rows || [],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (err) {
    console.error("GET /api/materials error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post('/api/materials', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;

    // Get user role
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const userRole = userResult.rows[0]?.user_role || "engineer";

    // Check permissions - leaders, engineers, and sales can create materials
    if (!["leader", "engineer", "sales"].includes(userRole)) {
      return c.json({ error: "Permission denied" }, 403);
    }

    const body = await c.req.json();
    const {
      name,
      description = null,
      category = null,
      unit_type = "Unit",
      unit_cost = 0,
      supplier = null,
      part_number = null,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return c.json(
        { error: "Material name is required" },
        400,
      );
    }

    // Create material
    const result = await pool.query(
      `INSERT INTO materials (
        name, description, category, unit_type, unit_cost, supplier, part_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name.trim(), description, category, unit_type, 
       parseFloat(unit_cost) || 0, supplier, part_number]
    );

    return c.json({
      material: result.rows[0],
      message: "Material created successfully",
    });
  } catch (err) {
    console.error("POST /api/materials error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get single material
app.get('/api/materials/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const materialQuery = 'SELECT * FROM materials WHERE id = $1';
    
    const result = await pool.query(materialQuery, [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Material not found' }, 404);
    }

    return c.json({ material: result.rows[0] });
  } catch (error) {
    console.error('Error fetching material:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update material
app.put('/api/materials/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'description', 'category', 'unit_type', 'unit_cost', 'supplier', 'part_number'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE materials 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Material not found' }, 404);
    }

    return c.json({ material: result.rows[0] });
  } catch (error) {
    console.error('Error updating material:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Delete material
app.delete('/api/materials/:id', async (c) => {
  try {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const result = await pool.query('DELETE FROM materials WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Material not found' }, 404);
    }

    return c.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Company Settings API endpoints
app.get('/api/settings/company', async (c) => {
  try {
    const session = c.get('session');
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's role
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if table exists, if not create it
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_settings'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create company_settings table
      await pool.query(`
        CREATE TABLE company_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

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
        ["letterheadBackgroundUrl", ""],
      ];

      for (const [key, value] of defaultSettings) {
        await pool.query(
          'INSERT INTO company_settings (setting_key, setting_value) VALUES ($1, $2)',
          [key, value]
        );
      }
    }

    // Get all settings
    const settingsResult = await pool.query(
      'SELECT setting_key, setting_value FROM company_settings'
    );

    const settings = {};
    settingsResult.rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return c.json({ settings });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.post('/api/settings/company', async (c) => {
  try {
    const session = c.get('session');
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's role
    const userResult = await pool.query(
      'SELECT user_role FROM auth_users WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = userResult.rows[0];
    if (user.user_role !== "leader") {
      return c.json(
        { error: "Forbidden: Only leaders can update company settings" },
        403,
      );
    }

    const body = await c.req.json();
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
      ["letterheadBackgroundUrl", letterheadBackgroundUrl],
    ];

    for (const [key, value] of settings) {
      await pool.query(
        `INSERT INTO company_settings (setting_key, setting_value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) 
         DO UPDATE SET 
           setting_value = EXCLUDED.setting_value,
           updated_at = CURRENT_TIMESTAMP`,
        [key, value || ""]
      );
    }

    return c.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error saving company settings:", error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default await createHonoServer({
  app,
  defaultLogger: false,
});
