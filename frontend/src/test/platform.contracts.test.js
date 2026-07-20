import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '../..');
const mobileRoot = join(frontendRoot, '../mobile');

describe('mobile keyboard config contracts', () => {
  it('keeps android.softwareKeyboardLayoutMode as resize', () => {
    const appJson = JSON.parse(readFileSync(join(mobileRoot, 'app.json'), 'utf8'));
    expect(appJson.expo.android.softwareKeyboardLayoutMode).toBe('resize');
  });

  it('uses undefined Android KeyboardAvoidingView behavior (not height)', () => {
    const files = [
      'src/screens/chat/ChatScreen.tsx',
      'src/screens/resume/ResumeScreen.tsx',
      'src/screens/capstone/CapstoneScreen.tsx',
      'src/screens/auth/LoginScreen.tsx',
    ];

    for (const rel of files) {
      const src = readFileSync(join(mobileRoot, rel), 'utf8');
      expect(src).toContain("behavior={Platform.OS === 'ios' ? 'padding' : undefined}");
      expect(src).not.toContain("behavior={Platform.OS === 'ios' ? 'padding' : 'height'}");
    }
  });

  it('adds Android keyboardDidShow OEM fallback on Chat and Login', () => {
    for (const rel of ['src/screens/chat/ChatScreen.tsx', 'src/screens/auth/LoginScreen.tsx']) {
      const src = readFileSync(join(mobileRoot, rel), 'utf8');
      expect(src).toContain("keyboardDidShow");
      expect(src).toContain("keyboardDidHide");
      expect(src).toContain('androidKeyboardHeight');
    }
  });
});
describe('capstone responsive width contract', () => {
  it('sets width:auto on feature items in tablet/phone media blocks', () => {
    const css = readFileSync(
      join(frontendRoot, 'src/pages/Capstone/capstone.css'),
      'utf8'
    );
    const block768 = css.split('@media (max-width: 768px)')[1]?.split('@media')[0] ?? '';
    const block600 = css.split('@media (max-width: 600px)')[1]?.split('@media')[0] ?? '';
    expect(block768).toMatch(/\.cs-feature-item\s*\{[^}]*width:\s*auto/s);
    expect(block600).toMatch(/\.cs-feature-item\s*\{[^}]*width:\s*auto/s);
  });
});
