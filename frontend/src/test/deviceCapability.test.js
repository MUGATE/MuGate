import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldDeferHeroVideo,
  shouldPrefetchRoutes,
  shouldUseFullGlow,
  shouldUseWebGLScene,
} from '../utils/deviceCapability';

describe('deviceCapability', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { ...navigator });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defers hero video when reduced motion', () => {
    const mm = (q) => ({ matches: q.includes('prefers-reduced-motion') });
    expect(shouldDeferHeroVideo(mm)).toBe(true);
  });

  it('allows hero video on coarse pointer (phones play compressed MP4)', () => {
    const mm = (q) => ({ matches: q.includes('pointer: coarse') });
    expect(shouldDeferHeroVideo(mm)).toBe(false);
  });

  it('allows hero video without reduced motion', () => {
    const mm = () => ({ matches: false });
    expect(shouldDeferHeroVideo(mm)).toBe(false);
  });

  it('allows hero video when called with no matchMedia arg (desktop Home path)', () => {
    vi.stubGlobal('window', {
      ...window,
      matchMedia: (q) => ({ matches: q.includes('prefers-reduced-motion') ? false : false }),
    });
    expect(shouldDeferHeroVideo()).toBe(false);
  });

  it('skips prefetch on Save-Data', () => {
    vi.stubGlobal('navigator', {
      connection: { saveData: true, effectiveType: '4g' },
    });
    const mm = () => ({ matches: false });
    expect(shouldPrefetchRoutes(mm)).toBe(false);
  });

  it('disables WebGL on coarse touch phones', () => {
    const mm = (q) => ({
      matches: q.includes('hover: none') || q.includes('pointer: coarse'),
    });
    expect(shouldUseWebGLScene(mm)).toBe(false);
  });

  it('uses lite glow on coarse pointers', () => {
    const mm = (q) => ({ matches: q.includes('pointer: coarse') });
    expect(shouldUseFullGlow(mm)).toBe(false);
  });
});
