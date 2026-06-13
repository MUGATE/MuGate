// Adapters between the normalized resume DATA model (resumeSchema.js) and the
// flat field shape the EXISTING /api/resume/generate backend expects. This is the
// bridge that guarantees "PDF/DOCX export matches the preview": preview and export
// both derive from the same normalized data, so the CONTENT is always identical.
//
// The backend generators are left completely untouched.

import { createEmptyResume, emptyEducation } from './resumeSchema';

const S = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const combineDates = (from, to) => {
  if (from && to) return `${from} – ${to}`;
  return from || to || '';
};

// ── Seed normalized data FROM the existing flat builder forms ─────────────────
export function fromLocalForm(form = {}, extras = {}) {
  const r = createEmptyResume('local');
  r.personal = {
    fullName: S(form.fullName), email: S(form.email), phone: S(form.phone),
    address: S(form.address), linkedin: S(form.linkedin),
  };
  r.summary = S(form.objective);

  const edu = [];
  if (form.eduInst1 || form.eduDegree1) {
    edu.push({ ...emptyEducation(), institution: S(form.eduInst1), location: S(form.eduLoc1),
      degree: S(form.eduDegree1), minor: S(form.eduMinor1), gradDate: S(form.eduGradDate1),
      coursework: S(form.eduCourses1), gpa: S(form.eduGpa1), dates: combineDates(form.eduFrom1, form.eduTo1) });
  }
  if (form.eduInst2) {
    edu.push({ ...emptyEducation(), institution: S(form.eduInst2), location: S(form.eduLoc2),
      gpa: S(form.eduGpa2), dates: combineDates(form.eduFrom2, form.eduTo2) });
  }
  (extras.edu || []).forEach((e) => edu.push({ ...emptyEducation(), institution: S(e.inst),
    location: S(e.loc), gpa: S(e.gpa), dates: combineDates(e.from, e.to) }));
  if (edu.length) r.education = edu;

  const exp = [];
  if (form.expCompany1 || form.expPos1) {
    exp.push({ organization: S(form.expCompany1), location: S(form.expLoc1), title: S(form.expPos1),
      dates: combineDates(form.expFrom1, form.expTo1), bullets: [S(form.expBullet1a), S(form.expBullet1b), S(form.expBullet1c)] });
  }
  if (form.expCompany2 || form.expPos2) {
    exp.push({ organization: S(form.expCompany2), location: S(form.expLoc2), title: S(form.expPos2),
      dates: combineDates(form.expFrom2, form.expTo2), bullets: [S(form.expBullet2a), S(form.expBullet2b)] });
  }
  (extras.exp || []).forEach((e) => exp.push({ organization: S(e.company), location: S(e.loc),
    title: S(e.pos), dates: combineDates(e.from, e.to), bullets: [S(e.bullet1), S(e.bullet2), S(e.bullet3)] }));
  if (exp.length) r.experience = exp;

  const projects = [];
  if (form.project1) projects.push({ text: S(form.project1) });
  if (form.project2) projects.push({ text: S(form.project2) });
  (extras.projects || []).forEach((p) => projects.push({ text: S(p.text) }));
  r.projects = projects;

  r.skills = {
    languages: S(form.languages), computer: S(form.computerSkills), research: S(form.researchSkills),
    technical: S(form.technicalSkills), soft: S(form.softSkills), laboratory: '', interests: '',
  };
  return r;
}

export function fromGlobalForm(form = {}, extras = {}) {
  const r = createEmptyResume('global');
  const fullName = [S(form.firstName), S(form.lastName)].filter(Boolean).join(' ');
  r.personal = { fullName, email: S(form.email), phone: S(form.phone), address: S(form.address), linkedin: '' };
  r.summary = '';

  const edu = [];
  if (form.eduInst || form.eduDegree) {
    edu.push({ ...emptyEducation(), institution: S(form.eduInst), location: S(form.eduLoc),
      degree: S(form.eduDegree), gpa: S(form.eduGpa), gradDate: S(form.eduGradDate), coursework: S(form.eduCoursework) });
  }
  if (form.hsName) {
    edu.push({ ...emptyEducation(), institution: S(form.hsName), location: S(form.hsLoc),
      coursework: S(form.hsDetails), gradDate: S(form.hsGradDate) });
  }
  if (form.abroadInst) {
    edu.push({ ...emptyEducation(), institution: S(form.abroadInst), location: S(form.abroadLoc),
      coursework: S(form.abroadCourse), dates: S(form.abroadDates) });
  }
  if (edu.length) r.education = edu;

  const exp = [];
  if (form.expOrg1 || form.expTitle1) {
    exp.push({ organization: S(form.expOrg1), location: S(form.expLoc1), title: S(form.expTitle1),
      dates: S(form.expDates1), bullets: [S(form.expB1a), S(form.expB1b), S(form.expB1c), S(form.expB1d)] });
  }
  if (form.expOrg2 || form.expTitle2) {
    exp.push({ organization: S(form.expOrg2), location: S(form.expLoc2), title: S(form.expTitle2),
      dates: S(form.expDates2), bullets: [S(form.expB2a), S(form.expB2b), S(form.expB2c), S(form.expB2d)] });
  }
  (extras.exp || []).forEach((e) => exp.push({ organization: S(e.org), location: S(e.loc),
    title: S(e.title), dates: S(e.dates), bullets: [S(e.b1), S(e.b2), S(e.b3), S(e.b4)] }));
  if (exp.length) r.experience = exp;

  const lead = [];
  if (form.leadOrg || form.leadRole) {
    lead.push({ organization: S(form.leadOrg), location: S(form.leadLoc), role: S(form.leadRole),
      dates: S(form.leadDates), bullets: [S(form.leadB1), S(form.leadB2)] });
  }
  (extras.lead || []).forEach((l) => lead.push({ organization: S(l.org), location: S(l.loc),
    role: S(l.role), dates: S(l.dates), bullets: [S(l.b1), S(l.b2)] }));
  r.leadership = lead;

  r.skills = {
    technical: S(form.technical), languages: S(form.language), laboratory: S(form.laboratory),
    interests: S(form.interests), computer: '', research: '', soft: '',
  };
  return r;
}

// ── Build the EXISTING backend payload FROM normalized data ───────────────────
// Returns { format, formData, extras } for POST /api/resume/generate.
export function toBackendPayload(data) {
  return data.template === 'global' ? toGlobalPayload(data) : toLocalPayload(data);
}

function toLocalPayload(d) {
  const edu = d.education || [];
  const exp = d.experience || [];
  const proj = d.projects || [];
  const e0 = edu[0] || {}, e1 = edu[1] || {};
  const x0 = exp[0] || {}, x1 = exp[1] || {};
  const b0 = x0.bullets || [], b1 = x1.bullets || [];

  const formData = {
    fullName: S(d.personal.fullName), address: S(d.personal.address), phone: S(d.personal.phone),
    email: S(d.personal.email), linkedin: S(d.personal.linkedin), objective: S(d.summary),
    eduFrom1: S(e0.dates), eduTo1: '', eduInst1: S(e0.institution), eduLoc1: S(e0.location),
    eduDegree1: S(e0.degree), eduMinor1: S(e0.minor), eduGradDate1: S(e0.gradDate),
    eduCourses1: S(e0.coursework), eduGpa1: S(e0.gpa),
    eduFrom2: S(e1.dates), eduTo2: '', eduInst2: S(e1.institution), eduLoc2: S(e1.location), eduGpa2: S(e1.gpa),
    expFrom1: S(x0.dates), expTo1: '', expCompany1: S(x0.organization), expLoc1: S(x0.location),
    expPos1: S(x0.title), expBullet1a: S(b0[0]), expBullet1b: S(b0[1]), expBullet1c: S(b0[2]),
    expFrom2: S(x1.dates), expTo2: '', expCompany2: S(x1.organization), expLoc2: S(x1.location),
    expPos2: S(x1.title), expBullet2a: S(b1[0]), expBullet2b: S(b1[1]),
    project1: S(proj[0]?.text), project2: S(proj[1]?.text),
    languages: S(d.skills.languages), computerSkills: S(d.skills.computer), researchSkills: S(d.skills.research),
    technicalSkills: S(d.skills.technical), softSkills: S(d.skills.soft),
  };

  const extras = {
    edu: edu.slice(2).map((e) => ({ from: S(e.dates), to: '', inst: S(e.institution), loc: S(e.location), gpa: S(e.gpa) })),
    exp: exp.slice(2).map((e) => {
      const b = e.bullets || [];
      return { from: S(e.dates), to: '', company: S(e.organization), loc: S(e.location), pos: S(e.title),
        bullet1: S(b[0]), bullet2: S(b[1]), bullet3: S(b[2]) };
    }),
    projects: proj.slice(2).map((p) => ({ text: S(p.text) })),
  };

  return { format: 'local', formData, extras };
}

function toGlobalPayload(d) {
  const name = S(d.personal.fullName).trim().split(/\s+/);
  const firstName = name[0] || '';
  const lastName = name.slice(1).join(' ');
  const edu = d.education || [];
  const exp = d.experience || [];
  const lead = d.leadership || [];
  const e0 = edu[0] || {}, eHs = edu[1] || {}, eAb = edu[2] || {};
  const x0 = exp[0] || {}, x1 = exp[1] || {};
  const b0 = x0.bullets || [], b1 = x1.bullets || [];
  const l0 = lead[0] || {}, lb = l0.bullets || [];

  const formData = {
    firstName, lastName, address: S(d.personal.address), email: S(d.personal.email), phone: S(d.personal.phone),
    eduInst: S(e0.institution), eduLoc: S(e0.location), eduDegree: S(e0.degree), eduGpa: S(e0.gpa),
    eduGradDate: S(e0.gradDate), eduCoursework: S(e0.coursework),
    abroadInst: S(eAb.institution), abroadLoc: S(eAb.location), abroadCourse: S(eAb.coursework), abroadDates: S(eAb.dates),
    hsName: S(eHs.institution), hsLoc: S(eHs.location), hsDetails: S(eHs.coursework), hsGradDate: S(eHs.gradDate),
    expOrg1: S(x0.organization), expLoc1: S(x0.location), expTitle1: S(x0.title), expDates1: S(x0.dates),
    expB1a: S(b0[0]), expB1b: S(b0[1]), expB1c: S(b0[2]), expB1d: S(b0[3]),
    expOrg2: S(x1.organization), expLoc2: S(x1.location), expTitle2: S(x1.title), expDates2: S(x1.dates),
    expB2a: S(b1[0]), expB2b: S(b1[1]), expB2c: S(b1[2]), expB2d: S(b1[3]),
    leadOrg: S(l0.organization), leadLoc: S(l0.location), leadRole: S(l0.role), leadDates: S(l0.dates),
    leadB1: S(lb[0]), leadB2: S(lb[1]),
    technical: S(d.skills.technical), language: S(d.skills.languages), laboratory: S(d.skills.laboratory), interests: S(d.skills.interests),
  };

  const extras = {
    exp: exp.slice(2).map((e) => {
      const b = e.bullets || [];
      return { org: S(e.organization), loc: S(e.location), title: S(e.title), dates: S(e.dates),
        b1: S(b[0]), b2: S(b[1]), b3: S(b[2]), b4: S(b[3]) };
    }),
    lead: lead.slice(1).map((l) => {
      const b = l.bullets || [];
      return { org: S(l.organization), loc: S(l.location), role: S(l.role), dates: S(l.dates), b1: S(b[0]), b2: S(b[1]) };
    }),
  };

  return { format: 'global', formData, extras };
}
