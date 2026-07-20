import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas" />,
  useFrame: () => {},
}));

vi.mock('@react-three/drei', () => ({
  Environment: () => null,
}));

vi.mock('three', () => ({
  MathUtils: { lerp: (a, b) => b },
  Vector3: class Vector3 {
    set() { return this; }
    copy() { return this; }
    lerp() { return this; }
  },
}));

vi.mock('../pages/Internship/components/LogoPlane', () => ({ default: () => null }));
vi.mock('../pages/Internship/components/GlassStage', () => ({ default: () => null }));
vi.mock('../pages/Internship/components/GodRayFountain', () => ({ default: () => null }));
vi.mock('../pages/Internship/components/BackgroundHalo', () => ({ default: () => null }));

import SceneEffect from '../pages/Internship/components/SceneEffect.jsx';

describe('SceneEffect reduced motion / capability gate', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders unique static logos, calls onReady, and does not mount Canvas', async () => {
    const onReady = vi.fn();
    const companies = [
      { id: 1, name: 'Alpha', svgString: 'alpha.png', colors: ['#fff'] },
      { id: 2, name: 'Beta', svgString: 'beta.png', colors: ['#eee'] },
      { id: 3, name: 'Gamma', svgString: 'gamma.png', colors: ['#ddd'] },
    ];

    render(
      <SceneEffect
        activeIndex={1}
        companies={companies}
        onLogoClick={vi.fn()}
        onReady={onReady}
      />
    );

    expect(screen.queryByTestId('r3f-canvas')).toBeNull();
    expect(screen.getByRole('list', { name: /company logos/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Beta', current: true })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Alpha' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Gamma' })).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });
  });
});
