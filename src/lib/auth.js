// src/lib/auth.js
//
// Auth layer for Knitspeed Stock Portal.
// All Supabase-specific auth calls live below the boundary marker.
// To swap providers later, rewrite only the marked section — keep the
// exported function signatures identical.

import { supabase } from './supabase';

// --- SUPABASE AUTH BOUNDARY ---
// Everything below this line is Supabase-specific.
// Exported functions above the app layer must keep stable signatures.

/**
 * Sign in with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ session: object|null, error: Error|null }>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { session: null, error };
  return { session: data.session, error: null };
}

/**
 * Sign out the current user.
 * @returns {Promise<{ error: Error|null }>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current Supabase session, or null if not signed in.
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[auth] getSession error:', error);
    return null;
  }
  return data.session ?? null;
}

/**
 * Fetch the profile row for a given user.
 * @param {string} userId — uuid from auth.users.id
 * @returns {Promise<object|null>}
 */
export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, tenant_id, customer_id, created_at')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('[auth] getProfile error:', error);
    return null;
  }
  return data;
}

/**
 * Fetch the role rows for a given user.
 * @param {string} userId — uuid from auth.users.id
 * @returns {Promise<Array<{role: string, scope_id: string|null}>>}
 */
export async function getRoles(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, scope_id')
    .eq('user_id', userId);
  if (error) {
    console.error('[auth] getRoles error:', error);
    return [];
  }
  return data ?? [];
}

/**
 * Subscribe to auth state changes (sign-in, sign-out, token refresh).
 * @param {(event: string, session: object|null) => void} callback
 * @returns {{ unsubscribe: () => void }}
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return {
    unsubscribe: () => data.subscription.unsubscribe(),
  };
}

// --- END SUPABASE AUTH BOUNDARY ---
