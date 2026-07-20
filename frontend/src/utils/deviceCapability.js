/**
 * Runtime capability checks for deferring heavy media / GPU work on constrained devices.
 */

function getConnection() {
  if (typeof navigator === "undefined") return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function resolveMatchMedia(matchMediaFn) {
  return (
    matchMediaFn ??
    (typeof window !== "undefined" ? window.matchMedia.bind(window) : null)
  );
}

export function prefersReducedMotion(matchMediaFn) {
  const mm = resolveMatchMedia(matchMediaFn);
  if (!mm) return true;
  return mm("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(matchMediaFn) {
  const mm = resolveMatchMedia(matchMediaFn);
  if (!mm) return false;
  return mm("(pointer: coarse)").matches;
}

export function isSaveDataEnabled() {
  const conn = getConnection();
  return Boolean(conn?.saveData);
}

export function isSlowNetwork() {
  const conn = getConnection();
  const type = conn?.effectiveType;
  return type === "slow-2g" || type === "2g";
}

/**
 * True when hero MP4 should not auto-download.
 * Only reduced-motion: compressed ~4MB video plays on other devices.
 */
export function shouldDeferHeroVideo(matchMediaFn) {
  return prefersReducedMotion(matchMediaFn);
}

/** True when idle route prefetching is safe (won't fight LCP on constrained links). */
export function shouldPrefetchRoutes(matchMediaFn) {
  if (isSaveDataEnabled() || isSlowNetwork()) return false;
  if (prefersReducedMotion(matchMediaFn)) return false;
  return true;
}

/**
 * WebGL / Three.js scene — skip on reduced motion, Save-Data, slow net,
 * or typical touch phones (coarse pointer + no hover).
 */
export function shouldUseWebGLScene(matchMediaFn) {
  const mm = resolveMatchMedia(matchMediaFn);
  if (!mm) return false;
  if (prefersReducedMotion(mm)) return false;
  if (isSaveDataEnabled() || isSlowNetwork()) return false;
  if (mm("(hover: none)").matches && mm("(pointer: coarse)").matches) {
    return false;
  }
  return true;
}

/** Full animated glow is expensive on mobile Safari compositors. */
export function shouldUseFullGlow(matchMediaFn) {
  const mm = resolveMatchMedia(matchMediaFn);
  if (!mm) return false;
  if (prefersReducedMotion(mm)) return false;
  if (isCoarsePointer(mm)) return false;
  return true;
}
