import { describe, expect, it } from 'vitest';
import { shouldDisableFluidTrail } from '../pages/Chatbot/components/FluidTrail.jsx';

function makeMatchMedia(flags) {
  return (query) => ({
    matches: Boolean(flags[query]),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
}

describe('shouldDisableFluidTrail', () => {
  it('disables when prefers-reduced-motion is reduce', () => {
    const mq = makeMatchMedia({
      '(prefers-reduced-motion: reduce)': true,
      '(hover: none)': false,
      '(pointer: coarse)': false,
    });
    expect(shouldDisableFluidTrail(mq)).toBe(true);
  });

  it('disables when hover:none and pointer:coarse', () => {
    const mq = makeMatchMedia({
      '(prefers-reduced-motion: reduce)': false,
      '(hover: none)': true,
      '(pointer: coarse)': true,
    });
    expect(shouldDisableFluidTrail(mq)).toBe(true);
  });

  it('allows trail on fine pointer even if hover:none alone', () => {
    const mq = makeMatchMedia({
      '(prefers-reduced-motion: reduce)': false,
      '(hover: none)': true,
      '(pointer: coarse)': false,
    });
    expect(shouldDisableFluidTrail(mq)).toBe(false);
  });

  it('allows trail on typical desktop', () => {
    const mq = makeMatchMedia({
      '(prefers-reduced-motion: reduce)': false,
      '(hover: none)': false,
      '(pointer: coarse)': false,
    });
    expect(shouldDisableFluidTrail(mq)).toBe(false);
  });

  it('disables when matchMedia is unavailable', () => {
    expect(shouldDisableFluidTrail(null)).toBe(true);
  });
});
