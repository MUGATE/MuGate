/**
 * Runtime capability checks for deferring heavy media / GPU work on constrained devices.
 */

function getConnection() {
  if (typeof navigator === "undefined") return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

export function prefersReducedMotion(matchMediaFn = typeof window !== "undefined" ? window.matchMedia.bind(window) : null) {
  if (!matchMediaFn) return true;
  return matchMediaFn("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(matchMediaFn = typeof window !== "undefined" ? window.matchMedia.bind(window) : null) {
  if (!matchMediaFn) return false;
  return matchMediaFn("(pointer: coarse)").matches;
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
 * Phones (coarse pointer) stay poster-only; also Save-Data / 2G / reduced-motion.
 */
export function shouldDeferHeroVideo(matchMediaFn) {
  return (
    prefersReducedMotion(matchMediaFn) ||
    isCoarsePointer(matchMediaFn) ||
    isSaveDataEnabled() ||
    isSlowNetwork()
  );
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
export function shouldUseWebGLScene(matchMediaFn = typeof window !== "undefined" ? window.matchMedia.bind(window) : null) {
  if (!matchMediaFn) return false;
  if (prefersReducedMotion(matchMediaFn)) return false;
  if (isSaveDataEnabled() || isSlowNetwork()) return false;
  if (matchMediaFn("(hover: none)").matches && matchMediaFn("(pointer: coarse)").matches) {
    return false;
  }
  return true;
}

/** Full animated glow is expensive on mobile Safari compositors. */
export function shouldUseFullGlow(matchMediaFn = typeof window !== "undefined" ? window.matchMedia.bind(window) : null) {
  if (!matchMediaFn) return false;
  if (prefersReducedMotion(matchMediaFn)) return false;
  if (isCoarsePointer(matchMediaFn)) return false;
  return true;
}
