import { getContext } from 'hono/context-storage';

/**
 * Get current authenticated user from Hono context
 */
export async function getAuthUser() {
  try {
    const c = getContext();
    const session = c.get('session');
    return session?.user || null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user, requiredRole) {
  if (!user || !user.user_role) return false;
  
  const roleHierarchy = {
    'leader': 4,
    'accounting': 3,
    'engineer': 2,
    'sales': 1
  };
  
  const userLevel = roleHierarchy[user.user_role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user, roles) {
  if (!user || !user.user_role) return false;
  return roles.includes(user.user_role);
}

/**
 * Middleware to check authentication
 */
export function requireAuth() {
  return async (c, next) => {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  };
}

/**
 * Middleware to check role
 */
export function requireRole(requiredRole) {
  return async (c, next) => {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!hasRole(session.user, requiredRole)) {
      return c.json({ 
        error: 'Forbidden', 
        message: `Required role: ${requiredRole}` 
      }, 403);
    }
    
    await next();
  };
}

/**
 * Middleware to check any of multiple roles
 */
export function requireAnyRole(roles) {
  return async (c, next) => {
    const session = c.get('session');
    if (!session || !session.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!hasAnyRole(session.user, roles)) {
      return c.json({ 
        error: 'Forbidden', 
        message: `Required roles: ${roles.join(', ')}` 
      }, 403);
    }
    
    await next();
  };
}

/**
 * Get user role permissions
 */
export function getRolePermissions(role) {
  const permissions = {
    'leader': [
      'view_all_projects',
      'create_project',
      'edit_project',
      'delete_project',
      'view_all_quotations',
      'create_quotation',
      'edit_quotation',
      'delete_quotation',
      'view_all_customers',
      'create_customer',
      'edit_customer',
      'delete_customer',
      'view_all_materials',
      'create_material',
      'edit_material',
      'delete_material',
      'view_financial_reports',
      'manage_users',
      'approve_material_requests',
      'view_all_invoices',
      'create_invoice',
      'edit_invoice'
    ],
    'accounting': [
      'view_all_projects',
      'view_all_quotations',
      'edit_quotation',
      'view_all_customers',
      'create_customer',
      'edit_customer',
      'view_all_materials',
      'view_financial_reports',
      'approve_material_requests',
      'view_all_invoices',
      'create_invoice',
      'edit_invoice'
    ],
    'engineer': [
      'view_assigned_projects',
      'edit_assigned_projects',
      'view_quotations',
      'view_customers',
      'view_materials',
      'create_material_request',
      'view_own_material_requests'
    ],
    'sales': [
      'view_assigned_projects',
      'view_quotations',
      'create_quotation',
      'edit_own_quotations',
      'view_customers',
      'create_customer',
      'edit_customer',
      'view_materials'
    ]
  };
  
  return permissions[role] || [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.user_role) return false;
  const permissions = getRolePermissions(user.user_role);
  return permissions.includes(permission);
}