import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../pages/Home/assets/Images/People/1644316355616.jpg', () => ({ default: 'img1.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1686746856357.jpg', () => ({ default: 'img2.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1697544403750.jpg', () => ({ default: 'img3.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1718358515256.jpg', () => ({ default: 'img4.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1744289956105.jpg', () => ({ default: 'img5.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1748257099713.jpg', () => ({ default: 'img6.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1755711584005.jpg', () => ({ default: 'img7.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1760352155629.jpg', () => ({ default: 'img8.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1770801752808.jpg', () => ({ default: 'img9.jpg' }));
vi.mock('../pages/Home/assets/Images/People/1770914179363.jpg', () => ({ default: 'img10.jpg' }));

import InternshipShowcase from '../pages/Home/components/InternshipShowcase.jsx';

describe('InternshipShowcase a11y / scroll', () => {
  it('uses decorative img alt under labeled button wrappers', () => {
    render(<InternshipShowcase />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    const imgs = document.querySelectorAll('.internship-image-wrapper img');
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach((img) => {
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('clears active overlay class on scroll', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('hover: none') || query.includes('pointer: coarse'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const rafQueue = [];
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    const { container } = render(
      <div className="home-scroll" style={{ height: 400, overflow: 'auto' }}>
        <InternshipShowcase />
      </div>
    );

    // Flush mount scroll handler rAF
    await act(async () => {
      while (rafQueue.length) rafQueue.shift()(16);
    });

    const wrapper = container.querySelector('.internship-image-wrapper');
    expect(wrapper).toBeTruthy();

    await act(async () => {
      fireEvent.click(wrapper);
    });
    expect(wrapper.classList.contains('is-active')).toBe(true);

    const scrollRoot = container.querySelector('.home-scroll');
    await act(async () => {
      fireEvent.scroll(scrollRoot);
      while (rafQueue.length) rafQueue.shift()(16);
    });

    expect(wrapper.classList.contains('is-active')).toBe(false);
  });
});
