// src/lib/session.js
//
// Session layer for Knitspeed Stock Portal.
// Builds a unified session object from Supabase auth + profiles + user_roles.
//
// Shape:
//   {
//     userId:     string | null,
//     email:      string | null,
//     roles:      Array<{ role: string, scope_id: string|null }>,
//     customerId: string | null,
//     tenantId:   string | null,
//     loading:    boolean,
//   }
//
// Session B note: this layer EXPOSES the real session but does NOT gate UI.
// StockPortal still renders for unauthenticated users — temp-open RLS policies
// on orders/order_items still cover read access. Gating happens in Session C.

import { useEffect, useState } from 'react';
import {
  getSession,
  getProfile,
  getRoles,
  onAuthStateChange,
} from './auth';

const EMPTY_SESSION = {
  userId: null,
  email: null,
  roles: [],
  customerId: null,
  tenantId: null,
  loading: true,
};

const UNAUTHED_SESSION = {
  ...EMPTY_SESSION,
  loading: false,
};

// In-memory snapshot for non-React callers (e.g. data hooks that need
// the current customerId without subscribing to React state).
let _currentSession = EMPTY_SESSION;

/**
 * Build the unified session object from a raw Supabase session.
 * Returns UNAUTHED_SESSION if rawSession is null.
 */
async function buildSession(rawSession) {
  if (!rawSession?.user) return UNAUTHED_SESSION;

  const userId = rawSession.user.id;
  const email = rawSession.user.email ?? null;

  // Fetch profile + roles in parallel.
  const [profile, roles] = await Promise.all([
    getProfile(userId),
    getRoles(userId),
  ]);

  return {
    userId,
    email,
    roles: roles ?? [],
    customerId: profile?.customer_id ?? null,
    tenantId: profile?.tenant_id ?? null,
    loading: false,
  };
}

/**
 * Snapshot accessor for non-React code paths.
 * Returns the most recently built session (may be stale by milliseconds
 * around auth events; React consumers should use useSession instead).
 */
export function getCurrentSession() {
  return _currentSession;
}

/**
 * React hook: returns the current session, re-renders on auth changes.
 *
 * Usage:
 *   const session = useSession();
 *   if (session.loading) return <Spinner />;
 *   if (!session.userId) return <PublicView />;  // (Session C will use this)
 *   return <PortalView session={session} />;
 */
export function useSession() {
  const [session, setSession] = useState(_currentSession);

  useEffect(() => {
    let cancelled = false;

    // Initial load.
    (async () => {
      const raw = await getSession();
      const built = await buildSession(raw);
      if (cancelled) return;
      _currentSession = built;
      setSession(built);
    })();

    // Subscribe to future auth changes.
    const { unsubscribe } = onAuthStateChange(async (_event, raw) => {
      const built = await buildSession(raw);
      if (cancelled) return;
      _currentSession = built;
      setSession(built);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return session;
}

/**
 * Convenience helpers for role checks. Mirror the SQL has_role() function
 * so client-side gating (Session C) and RLS policies stay aligned.
 */
export function hasRole(session, roleName) {
  return (session?.roles ?? []).some((r) => r.role === roleName);
}

export function isProvider(session) {
  return hasRole(session, 'provider');
}

export function isCustomer(session) {
  return hasRole(session, 'customer');
}

export function isAdmin(session) {
  return hasRole(session, 'admin');
}
