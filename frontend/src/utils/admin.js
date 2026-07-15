/**
 * Client-side admin helpers. Backend is the source of truth — never trust JWT claims alone.
 */

export function readStoredUser() {
  try {
    const raw = localStorage.getItem("mugate_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Prefer the isAdmin flag set at login / refreshed via /auth/me/is-admin. */
export function isAdminFromStorage() {
  const user = readStoredUser();
  return !!(user && user.isAdmin === true);
}
