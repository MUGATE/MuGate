/** Bridge normalized resume JSON (from /resume/convert + /resume/ai-edit) to /resume/generate payload. */

export type NormalizedResume = {
  template?: 'local' | 'global';
  personal: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
  };
  summary?: string;
  education?: Array<{
    institution?: string;
    location?: string;
    degree?: string;
    minor?: string;
    dates?: string;
    gradDate?: string;
    gpa?: string;
    coursework?: string;
  }>;
  experience?: Array<{
    organization?: string;
    location?: string;
    title?: string;
    dates?: string;
    bullets?: string[];
  }>;
  projects?: Array<{ text?: string }>;
  leadership?: Array<{
    organization?: string;
    location?: string;
    role?: string;
    dates?: string;
    bullets?: string[];
  }>;
  skills?: {
    languages?: string;
    computer?: string;
    research?: string;
    technical?: string;
    soft?: string;
    laboratory?: string;
    interests?: string;
  };
};

const S = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

export function toBackendPayload(data: NormalizedResume) {
  return data.template === 'global' ? toGlobalPayload(data) : toLocalPayload(data);
}

function toLocalPayload(d: NormalizedResume) {
  const edu = d.education ?? [];
  const exp = d.experience ?? [];
  const proj = d.projects ?? [];
  const e0 = edu[0] ?? {};
  const e1 = edu[1] ?? {};
  const x0 = exp[0] ?? {};
  const x1 = exp[1] ?? {};
  const b0 = x0.bullets ?? [];
  const b1 = x1.bullets ?? [];

  const formData: Record<string, string> = {
    fullName: S(d.personal?.fullName),
    address: S(d.personal?.address),
    phone: S(d.personal?.phone),
    email: S(d.personal?.email),
    linkedin: S(d.personal?.linkedin),
    objective: S(d.summary),
    eduFrom1: S(e0.dates),
    eduTo1: '',
    eduInst1: S(e0.institution),
    eduLoc1: S(e0.location),
    eduDegree1: S(e0.degree),
    eduMinor1: S(e0.minor),
    eduGradDate1: S(e0.gradDate),
    eduCourses1: S(e0.coursework),
    eduGpa1: S(e0.gpa),
    eduFrom2: S(e1.dates),
    eduTo2: '',
    eduInst2: S(e1.institution),
    eduLoc2: S(e1.location),
    eduGpa2: S(e1.gpa),
    expFrom1: S(x0.dates),
    expTo1: '',
    expCompany1: S(x0.organization),
    expLoc1: S(x0.location),
    expPos1: S(x0.title),
    expBullet1a: S(b0[0]),
    expBullet1b: S(b0[1]),
    expBullet1c: S(b0[2]),
    expFrom2: S(x1.dates),
    expTo2: '',
    expCompany2: S(x1.organization),
    expLoc2: S(x1.location),
    expPos2: S(x1.title),
    expBullet2a: S(b1[0]),
    expBullet2b: S(b1[1]),
    project1: S(proj[0]?.text),
    project2: S(proj[1]?.text),
    languages: S(d.skills?.languages),
    computerSkills: S(d.skills?.computer),
    researchSkills: S(d.skills?.research),
    technicalSkills: S(d.skills?.technical),
    softSkills: S(d.skills?.soft),
  };

  const extras = {
    edu: edu.slice(2).map((e) => ({
      from: S(e.dates),
      to: '',
      inst: S(e.institution),
      loc: S(e.location),
      gpa: S(e.gpa),
    })),
    exp: exp.slice(2).map((e) => {
      const b = e.bullets ?? [];
      return {
        from: S(e.dates),
        to: '',
        company: S(e.organization),
        loc: S(e.location),
        pos: S(e.title),
        bullet1: S(b[0]),
        bullet2: S(b[1]),
        bullet3: S(b[2]),
      };
    }),
    projects: proj.slice(2).map((p) => ({ text: S(p.text) })),
  };

  return { format: 'local' as const, formData, extras };
}

function toGlobalPayload(d: NormalizedResume) {
  const name = S(d.personal?.fullName).trim().split(/\s+/);
  const firstName = name[0] ?? '';
  const lastName = name.slice(1).join(' ');
  const edu = d.education ?? [];
  const exp = d.experience ?? [];
  const lead = d.leadership ?? [];
  const e0 = edu[0] ?? {};
  const eHs = edu[1] ?? {};
  const eAb = edu[2] ?? {};
  const x0 = exp[0] ?? {};
  const x1 = exp[1] ?? {};
  const b0 = x0.bullets ?? [];
  const b1 = x1.bullets ?? [];
  const l0 = lead[0] ?? {};
  const lb = l0.bullets ?? [];

  const formData: Record<string, string> = {
    firstName,
    lastName,
    address: S(d.personal?.address),
    email: S(d.personal?.email),
    phone: S(d.personal?.phone),
    eduInst: S(e0.institution),
    eduLoc: S(e0.location),
    eduDegree: S(e0.degree),
    eduGpa: S(e0.gpa),
    eduGradDate: S(e0.gradDate),
    eduCoursework: S(e0.coursework),
    abroadInst: S(eAb.institution),
    abroadLoc: S(eAb.location),
    abroadCourse: S(eAb.coursework),
    abroadDates: S(eAb.dates),
    hsName: S(eHs.institution),
    hsLoc: S(eHs.location),
    hsDetails: S(eHs.coursework),
    hsGradDate: S(eHs.gradDate),
    expOrg1: S(x0.organization),
    expLoc1: S(x0.location),
    expTitle1: S(x0.title),
    expDates1: S(x0.dates),
    expB1a: S(b0[0]),
    expB1b: S(b0[1]),
    expB1c: S(b0[2]),
    expB1d: S(b0[3]),
    expOrg2: S(x1.organization),
    expLoc2: S(x1.location),
    expTitle2: S(x1.title),
    expDates2: S(x1.dates),
    expB2a: S(b1[0]),
    expB2b: S(b1[1]),
    expB2c: S(b1[2]),
    expB2d: S(b1[3]),
    leadOrg: S(l0.organization),
    leadLoc: S(l0.location),
    leadRole: S(l0.role),
    leadDates: S(l0.dates),
    leadB1: S(lb[0]),
    leadB2: S(lb[1]),
    technical: S(d.skills?.technical),
    language: S(d.skills?.languages),
    laboratory: S(d.skills?.laboratory),
    interests: S(d.skills?.interests),
  };

  const extras = {
    exp: exp.slice(2).map((e) => {
      const b = e.bullets ?? [];
      return {
        org: S(e.organization),
        loc: S(e.location),
        title: S(e.title),
        dates: S(e.dates),
        b1: S(b[0]),
        b2: S(b[1]),
        b3: S(b[2]),
        b4: S(b[3]),
      };
    }),
    lead: lead.slice(1).map((l) => {
      const b = l.bullets ?? [];
      return {
        org: S(l.organization),
        loc: S(l.location),
        role: S(l.role),
        dates: S(l.dates),
        b1: S(b[0]),
        b2: S(b[1]),
      };
    }),
  };

  return { format: 'global' as const, formData, extras };
}
