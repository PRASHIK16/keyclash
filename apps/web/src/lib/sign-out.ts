/**
 * Full sign-out: server-side cookie clearing (via the route handler, since
 * only Route Handlers/Server Actions can mutate cookies — a Server
 * Component cannot) plus a defensive client-side sweep.
 *
 * The sweep deliberately does NOT call localStorage.clear() / sessionStorage.clear()
 * wholesale — that would also wipe `keyclash:settings` (font size, caret
 * style, sound, etc.), which are device preferences, not authentication
 * data, and there's no reason logging out should reset someone's UI
 * preferences. Instead, this only removes keys that look like Supabase
 * auth data (its storage keys are always prefixed "sb-"), which is the
 * complete set of auth-related client storage our architecture can
 * produce — we use cookie-based session storage (@supabase/ssr), not
 * localStorage, for the session itself, so this sweep is a defensive
 * safety net rather than the primary mechanism.
 */
function sweepSupabaseStorage(storage: Storage) {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith("sb-")) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}

export async function signOutEverywhere() {
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } catch {
    // Even if the network call fails, still attempt the client-side sweep
    // and redirect below — better to end up on the sign-in page than stuck
    // on a page that thinks it's still authenticated.
  }

  try {
    sweepSupabaseStorage(window.localStorage);
    sweepSupabaseStorage(window.sessionStorage);
  } catch {
    // Storage may be unavailable (private browsing restrictions, etc.) —
    // not fatal, the server-side cookie clear is what actually matters.
  }

  // Full navigation, not router.push — guarantees every in-memory React
  // state (profile data, race state, anything cached in a hook) is
  // discarded rather than potentially flashing stale authenticated UI.
  window.location.href = "/sign-in";
}
