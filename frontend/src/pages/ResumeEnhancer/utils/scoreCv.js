// Deterministic, INSTANT resume score from the structured CV (0–100).
// Awards points for meaningful content (real words, verbs, quantified metrics),
// not raw character length or arbitrary digits/gibberish.
const ACTION_VERBS = /\b(develop(?:ed)?|built?|design(?:ed)?|manag(?:ed)?|led|create(?:d)?|implement(?:ed)?|improv(?:ed)?|increas(?:ed)?|reduc(?:ed)?|launch(?:ed)?|organiz(?:ed)?|analyz(?:ed)?|engineer(?:ed)?|optimiz(?:ed)?|deliver(?:ed)?|coordinat(?:ed)?|assist(?:ed)?|support(?:ed)?|provid(?:ed)?|collaborat(?:ed)?|automat(?:ed)?|maintain(?:ed)?|wrote|test(?:ed)?|achiev(?:ed)?|conduct(?:ed)?|establish(?:ed)?|generat(?:ed)?|mentor(?:ed)?|train(?:ed)?)\b/i;

// Real impact metrics — not bare digits like "123" or "asdf1".
const METRICS = /(\d+%|\$[\d,]+|\b\d+\s*(users|clients|projects|members|students|hours|people|teams?)\b|(increased|decreased|improved|reduced|grew|cut|saved)\s+(by\s+)?\d+)/i;

const EMAIL_RE = /^[^\s@]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const LINKEDIN_RE = /linkedin\.com|linkedin/i;
const REPEATED_CHAR = /(.)\1{3,}/;
const KEYBOARD_SPAM = /^(asdf+|qwer+|zxcv+|hjkl+|qwerty|abcdefg?|1234+|xxxx+|aaaa+)$/i;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function looksLikeGibberish(w) {
  if (!w || w.length < 2) return true;
  if (REPEATED_CHAR.test(w)) return true;
  if (KEYBOARD_SPAM.test(w)) return true;
  return false;
}

/** Prose tokens: letters, length ≥ 2, contains a vowel; skip digit/keyboard spam. */
function meaningfulWords(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['.-]+|['.-]+$/g, ''))
    .filter((w) => {
      if (w.length < 2) return false;
      if (!/[a-z]/.test(w)) return false;
      if (!/[aeiouy]/.test(w)) return false;
      if (looksLikeGibberish(w)) return false;
      const letters = (w.match(/[a-z]/g) || []).length;
      const vowels = (w.match(/[aeiouy]/g) || []).length;
      if (letters >= 4 && vowels / letters < 0.22) return false;
      return true;
    });
}

/** Skill tokens: allow SQL/HTML/CSS/C++ (no vowel required); reject digit spam. */
function skillTokens(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .toLowerCase()
    .split(/[,;/|]+|\s+/)
    .map((w) => w.trim().replace(/^["'(]+|[)"']+$/g, ''))
    .filter((w) => {
      if (w.length < 2) return false;
      if (!/[a-z+#.]/.test(w)) return false;
      if (/^\d+$/.test(w)) return false;
      if (looksLikeGibberish(w)) return false;
      return true;
    });
}

function hasMeaningfulText(text, minWords = 1) {
  return meaningfulWords(text).length >= minWords;
}

/** Score by meaningful word-count bands (0–maxPts). Gibberish → 0. */
function contentScore(text, maxPts, { good = 6, strong = 14 } = {}) {
  const n = meaningfulWords(text).length;
  if (n === 0) return 0;
  if (n < 2) return Math.round(maxPts * 0.25);
  if (n < good) return Math.round(maxPts * 0.5);
  if (n < strong) return Math.round(maxPts * 0.75);
  return maxPts;
}

function skillContentScore(text, maxPts, { good = 4, strong = 12 } = {}) {
  const n = skillTokens(text).length;
  if (n === 0) return 0;
  if (n < 2) return Math.round(maxPts * 0.35);
  if (n < good) return Math.round(maxPts * 0.55);
  if (n < strong) return Math.round(maxPts * 0.8);
  return maxPts;
}

/** Extra quality bonus for action verbs and real quantified metrics. */
function qualityBonus(text, maxPts) {
  const t = (text || '').trim();
  if (!t || !hasMeaningfulText(t, 2)) return 0;
  let b = 0;
  if (ACTION_VERBS.test(t)) b += maxPts * 0.55;
  if (METRICS.test(t)) b += maxPts * 0.45;
  return Math.round(b);
}

function scoreName(name) {
  const words = meaningfulWords(name);
  if (words.length === 0) return 0;
  // Prefer first + last; a single solid word still counts lightly
  if (words.length >= 2) return 3;
  if (words[0].length >= 3) return 2;
  return 1;
}

export function scoreCv(d) {
  if (!d) return 0;
  let s = 0;
  const p = d.personal || {};

  // Contact (15) — validated shape, not mere non-empty fields
  s += scoreName(p.fullName);
  const email = (p.email || '').trim();
  if (email && EMAIL_RE.test(email)) s += 4;
  else if (email && email.includes('@')) s += 1;
  const phoneDigits = (p.phone || '').replace(/\D/g, '');
  if (phoneDigits.length >= 7) s += 3;
  else if (phoneDigits.length >= 4) s += 1;
  if (hasMeaningfulText(p.address, 2)) s += contentScore(p.address, 2, { good: 3, strong: 6 });
  const li = (p.linkedin || '').trim();
  if (li && LINKEDIN_RE.test(li)) s += 3;
  else if (li && /https?:\/\//i.test(li) && hasMeaningfulText(li, 1)) s += 1;

  // Summary / objective (12)
  s += contentScore(d.summary, 12, { good: 8, strong: 20 });

  // Education (15)
  const edu = (d.education || []).filter(
    (e) => hasMeaningfulText(e.institution) || hasMeaningfulText(e.degree)
  );
  if (edu.length >= 1) {
    s += 5;
    const eduText = edu
      .map((e) => [e.institution, e.degree, e.gpa, e.gradDate, e.dates, e.coursework].join(' '))
      .join(' ');
    s += contentScore(eduText, 6, { good: 4, strong: 10 });
    if (edu.some((e) => hasMeaningfulText(e.degree))) s += 2;
    if (edu.some((e) => {
      const gpa = (e.gpa || '').trim();
      const dates = `${e.gradDate || ''} ${e.dates || ''}`.trim();
      const hasGpa = /^\s*\d+(\.\d+)?\s*(\/\s*\d+(\.\d+)?)?\s*$/.test(gpa) ||
        (/gpa|honor|cum laude|dean/i.test(gpa) && hasMeaningfulText(gpa, 1));
      const hasDate = /\b(19|20)\d{2}\b/.test(dates) || hasMeaningfulText(dates, 1);
      return hasGpa || hasDate;
    })) s += 2;
  }

  // Experience (30)
  const exp = (d.experience || []).filter(
    (e) => hasMeaningfulText(e.title) || hasMeaningfulText(e.organization)
  );
  const bullets = exp.flatMap((e) =>
    (e.bullets || []).filter((b) => b && hasMeaningfulText(b, 2))
  );
  if (exp.length >= 1) s += 5;
  if (exp.length >= 2) s += 3;
  const bulletBlob = bullets.join(' ');
  s += contentScore(bulletBlob, 12, { good: 10, strong: 24 });
  s += qualityBonus(bulletBlob, 6);
  if (bullets.length >= 2) s += 2;
  if (bullets.length >= 4) s += 2;

  // Projects / leadership (12)
  const proj = (d.projects || []).filter((x) => hasMeaningfulText(x.text, 2));
  const lead = (d.leadership || []).filter(
    (e) =>
      hasMeaningfulText(e.organization) ||
      hasMeaningfulText(e.role) ||
      hasMeaningfulText(e.text, 2)
  );
  const projLeadText = [
    ...proj.map((x) => x.text),
    ...lead.map((e) => [e.organization, e.role, e.text].filter(Boolean).join(' ')),
  ].join(' ');
  s += contentScore(projLeadText, 12, { good: 6, strong: 16 });

  // Skills (16) — skill-like tokens (SQL/HTML ok), not random letters/digits
  const sk = d.skills || {};
  const skillVals = ['languages', 'computer', 'technical', 'research', 'soft', 'laboratory', 'interests']
    .map((k) => sk[k])
    .filter((v) => skillTokens(v).length >= 1);
  if (skillVals.length >= 1) s += 4;
  if (skillVals.length >= 2) s += 3;
  if (skillVals.length >= 3) s += 3;
  s += skillContentScore(skillVals.join(' '), 6, { good: 4, strong: 12 });

  return clamp(Math.round(s), 0, 100);
}
