/**
 * Auth wrapper for Hono context
 */
import { getContext } from 'hono/context-storage';

export async function auth() {
  const c = getContext();
  return c.get('authUser');
}