import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Element.prototype.scrollIntoView = vi.fn();

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(16), 0);
}
if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}
