// Normalized, template-agnostic resume DATA model for the live editor.
// The SAME data renders through the Local or Global TEMPLATE and exports to the
// existing /api/resume/generate backend via adapters.js. Keeping data separate
// from presentation is what lets one resume render as either CV style.

export const emptyEducation = () => ({
  institution: '', location: '', degree: '', minor: '',
  dates: '', gradDate: '', gpa: '', coursework: '',
});

export const emptyExperience = () => ({
  organization: '', location: '', title: '', dates: '', bullets: ['', '', ''],
});

export const emptyLeadership = () => ({
  organization: '', location: '', role: '', dates: '', bullets: ['', ''],
});

export const emptyProject = () => ({ text: '' });

export const createEmptyResume = (template = 'local') => ({
  template,
  personal: { fullName: '', email: '', phone: '', address: '', linkedin: '' },
  summary: '',
  education: [emptyEducation()],
  experience: [emptyExperience()],
  projects: [],
  leadership: [],
  skills: { languages: '', computer: '', research: '', technical: '', soft: '', laboratory: '', interests: '' },
});

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const strArr = (v) => (Array.isArray(v) ? v.map(str) : []);

/**
 * Coerce any object (e.g. AI output, persisted state) into the strict schema so
 * the editor + templates never crash on missing/extra fields.
 */
export function normalizeResume(input) {
  const base = createEmptyResume(input?.template === 'global' ? 'global' : 'local');
  if (!input || typeof input !== 'object') return base;
  const p = input.personal || {};
  const s = input.skills || {};
  return {
    template: input.template === 'global' ? 'global' : 'local',
    personal: {
      fullName: str(p.fullName), email: str(p.email), phone: str(p.phone),
      address: str(p.address), linkedin: str(p.linkedin),
    },
    summary: str(input.summary),
    education: Array.isArray(input.education) && input.education.length
      ? input.education.map((e) => ({ ...emptyEducation(), ...pick(e, emptyEducation()) }))
      : base.education,
    experience: Array.isArray(input.experience) && input.experience.length
      ? input.experience.map((e) => ({
          organization: str(e?.organization), location: str(e?.location),
          title: str(e?.title), dates: str(e?.dates), bullets: strArr(e?.bullets),
        }))
      : base.experience,
    projects: Array.isArray(input.projects)
      ? input.projects.map((x) => ({ text: str(x?.text ?? x) }))
      : [],
    leadership: Array.isArray(input.leadership)
      ? input.leadership.map((e) => ({
          organization: str(e?.organization), location: str(e?.location),
          role: str(e?.role), dates: str(e?.dates), bullets: strArr(e?.bullets),
        }))
      : [],
    skills: {
      languages: str(s.languages), computer: str(s.computer), research: str(s.research),
      technical: str(s.technical), soft: str(s.soft), laboratory: str(s.laboratory), interests: str(s.interests),
    },
  };
}

function pick(obj, shape) {
  const out = {};
  for (const k of Object.keys(shape)) out[k] = str(obj?.[k]);
  return out;
}

/** True if any of the given skill fields has a value. */
export const hasAnySkill = (skills, fields) => fields.some((f) => skills?.[f]);

// Content checks — used to hide empty sections/entries in preview mode.
export const eduHasContent = (e) =>
  !!(e && (e.institution || e.degree || e.gpa || e.coursework || e.location || e.dates || e.minor || e.gradDate));
export const expHasContent = (x) =>
  !!(x && (x.organization || x.title || x.role || x.location || x.dates || (x.bullets || []).some((b) => b)));
export const projHasContent = (p) => !!(p && p.text);

/**
 * Immutable setter by dot path, e.g. set(data, 'experience.1.bullets.0', 'text').
 * Returns a new object; never mutates the input. Used for instant live edits.
 */
export function setByPath(obj, path, value) {
  const keys = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = cursor[k];
    cursor[k] = Array.isArray(next) ? [...next] : { ...next };
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}
