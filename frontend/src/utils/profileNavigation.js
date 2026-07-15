export const PROFILE_RETURN_KEY = "mugate_profile_return";

const IGNORED_RETURN_PATHS = new Set(["/profile", "/admin-control"]);

export function getProfileReturnPath() {
  const path = sessionStorage.getItem(PROFILE_RETURN_KEY);
  if (!path || IGNORED_RETURN_PATHS.has(path)) return null;
  return path;
}

export function rememberProfileReturnPath(previousPath) {
  if (!previousPath || IGNORED_RETURN_PATHS.has(previousPath)) return;
  sessionStorage.setItem(PROFILE_RETURN_KEY, previousPath);
}
