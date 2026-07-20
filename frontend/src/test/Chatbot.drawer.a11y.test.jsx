import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/chatbotApi', () => ({
  getSessions: vi.fn(async () => [{ id: 's1', title: 'Hello' }]),
  getSessionMessages: vi.fn(async () => []),
  createSession: vi.fn(async () => ({ id: 's2', title: 'New Chat' })),
  deleteSession: vi.fn(async () => {}),
  sendMessage: vi.fn(async () => ({})),
}));

vi.mock('../pages/Chatbot/components/FluidTrail', () => ({
  default: () => null,
  shouldDisableFluidTrail: () => true,
}));

vi.mock('../pages/Chatbot/assets/images/Logo2.png', () => ({ default: 'logo.png' }));

import Chatbot from '../pages/Chatbot/Chatbot.jsx';

function mockMatchMedia(matchesByQuery) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: Boolean(matchesByQuery(query)),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('Chatbot drawer a11y', () => {
  beforeEach(() => {
    mockMatchMedia((q) => q.includes('max-width: 640px'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marks sidebar hidden+inert when narrow and closed', async () => {
    render(
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: /open chat menu/i });
    const aside = document.getElementById('chatbot-sidebar');
    expect(aside).toBeTruthy();
    expect(aside.getAttribute('aria-hidden')).toBe('true');
    expect(aside.hasAttribute('inert')).toBe(true);
    expect(aside.classList.contains('is-drawer-hidden')).toBe(true);
  });

  it('opens as dialog, moves focus, and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    );

    const menu = await screen.findByRole('button', { name: /open chat menu/i });
    menu.focus();
    await user.click(menu);

    const dialog = await screen.findByRole('dialog', { name: /chat menu/i });
    expect(dialog.hasAttribute('inert')).toBe(false);

    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.getElementById('chatbot-sidebar')?.getAttribute('aria-hidden')).toBe('true');
      expect(document.activeElement).toBe(menu);
    });
  });

  it('clears open drawer state when viewport becomes wide', async () => {
    const user = userEvent.setup();
    let narrow = true;
    const listeners = [];

    window.matchMedia = vi.fn().mockImplementation((query) => {
      const isNarrowQuery = query.includes('max-width: 640px');
      return {
        get matches() {
          return isNarrowQuery ? narrow : false;
        },
        media: query,
        addEventListener: (_evt, cb) => listeners.push(cb),
        removeEventListener: vi.fn(),
        addListener: (cb) => listeners.push(cb),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    render(
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    );

    const menu = await screen.findByRole('button', { name: /open chat menu/i });
    await user.click(menu);
    expect(await screen.findByRole('dialog', { name: /chat menu/i })).toBeTruthy();

    narrow = false;
    listeners.forEach((cb) => cb());

    await waitFor(() => {
      const aside = document.getElementById('chatbot-sidebar');
      expect(aside?.getAttribute('role')).not.toBe('dialog');
      expect(aside?.classList.contains('is-drawer-open')).toBe(false);
    });
  });

  it('can focus and activate a session button from the drawer', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: /open chat menu/i }));
    const sessionBtn = await screen.findByRole('button', { name: 'Hello' });
    sessionBtn.focus();
    expect(document.activeElement).toBe(sessionBtn);
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(document.getElementById('chatbot-sidebar')?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
