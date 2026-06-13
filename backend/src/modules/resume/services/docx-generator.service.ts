import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType } from "docx";
import type { ResumeExtras } from "./pdf-generator.service";

const HALF_PAGE = 4680; // ~half page in twips for right-aligned tabs

function dateRange(from: string, to: string): string {
  if (from && to) return `${from} – ${to}`;
  if (from) return from;
  if (to) return to;
  return "";
}

/** Safely read a trimmed string from an extra-entry object. */
function ex(obj: Record<string, string>, key: string): string {
  const v = obj?.[key];
  return typeof v === "string" ? v.trim() : "";
}

function docxSectionHeading(title: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 22, font: "Calibri" })],
    spacing: { before: 200, after: 40 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
  });
}

function docxBullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Calibri" })],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function docxLine(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, font: "Calibri" }),
      new TextRun({ text: value, size: 20, font: "Calibri" }),
    ],
    spacing: { after: 40 },
  });
}

function docxOrgLine(org: string, rightText: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: org, bold: true, size: 20, font: "Calibri" }),
      new TextRun({ text: `\t${rightText}`, size: 18, font: "Calibri" }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: HALF_PAGE }],
    spacing: { after: 20 },
  });
}

function buildLocalDocx(f: Record<string, string>, extras: ResumeExtras = {}): Paragraph[] {
  const paras: Paragraph[] = [];
  const extraEdu = extras.edu ?? [];
  const extraExp = extras.exp ?? [];
  const extraProjects = extras.projects ?? [];

  // Header
  if (f.fullName) {
    paras.push(new Paragraph({
      children: [new TextRun({ text: f.fullName, bold: true, size: 36, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 }
    }));
  }
  const contactParts = [f.address, f.phone, f.email, f.linkedin].filter(Boolean);
  if (contactParts.length) {
    paras.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join("  |  "), size: 19, font: "Calibri", color: "333333" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }));
  }

  // Objective
  if (f.objective) {
    paras.push(docxSectionHeading("OBJECTIVE / PROFILE"));
    paras.push(new Paragraph({
      children: [new TextRun({ text: f.objective, size: 20, font: "Calibri" })],
      spacing: { after: 80 }
    }));
  }

  // Education
  if (f.eduInst1 || f.eduInst2 || extraEdu.some(e => ex(e, "inst"))) {
    paras.push(docxSectionHeading("EDUCATION"));
    if (f.eduInst1) {
      const dates = dateRange(f.eduFrom1, f.eduTo1);
      const right = [f.eduLoc1, dates].filter(Boolean).join("  |  ");
      paras.push(docxOrgLine(f.eduInst1, right));
      if (f.eduDegree1) paras.push(new Paragraph({ children: [new TextRun({ text: f.eduDegree1, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.eduMinor1) paras.push(new Paragraph({ children: [new TextRun({ text: `Minor: ${f.eduMinor1}`, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.eduGradDate1) paras.push(new Paragraph({ children: [new TextRun({ text: `Expected Graduation: ${f.eduGradDate1}`, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.eduCourses1) paras.push(new Paragraph({ children: [new TextRun({ text: `Relevant Courses: ${f.eduCourses1}`, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.eduGpa1) paras.push(new Paragraph({ children: [new TextRun({ text: `GPA / Honors: ${f.eduGpa1}`, size: 20, font: "Calibri" })], spacing: { after: 60 } }));
    }
    if (f.eduInst2) {
      const dates2 = dateRange(f.eduFrom2, f.eduTo2);
      const right = [f.eduLoc2, dates2].filter(Boolean).join("  |  ");
      paras.push(docxOrgLine(f.eduInst2, right));
      if (f.eduGpa2) paras.push(new Paragraph({ children: [new TextRun({ text: `GPA / Honors: ${f.eduGpa2}`, size: 20, font: "Calibri" })], spacing: { after: 60 } }));
    }
    for (const e of extraEdu) {
      const inst = ex(e, "inst");
      if (!inst) continue;
      const right = [ex(e, "loc"), dateRange(ex(e, "from"), ex(e, "to"))].filter(Boolean).join("  |  ");
      paras.push(docxOrgLine(inst, right));
      const gpa = ex(e, "gpa");
      if (gpa) paras.push(new Paragraph({ children: [new TextRun({ text: `GPA / Honors: ${gpa}`, size: 20, font: "Calibri" })], spacing: { after: 60 } }));
    }
  }

  // Experience
  if (f.expCompany1 || f.expCompany2 || extraExp.some(e => ex(e, "company") || ex(e, "pos"))) {
    paras.push(docxSectionHeading("EXPERIENCE"));
    if (f.expCompany1) {
      const dates = dateRange(f.expFrom1, f.expTo1);
      paras.push(docxOrgLine(f.expCompany1, [f.expLoc1, dates].filter(Boolean).join("  |  ")));
      if (f.expPos1) paras.push(new Paragraph({ children: [new TextRun({ text: f.expPos1, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.expBullet1a) paras.push(docxBullet(f.expBullet1a));
      if (f.expBullet1b) paras.push(docxBullet(f.expBullet1b));
      if (f.expBullet1c) paras.push(docxBullet(f.expBullet1c));
    }
    if (f.expCompany2) {
      const dates = dateRange(f.expFrom2, f.expTo2);
      paras.push(docxOrgLine(f.expCompany2, [f.expLoc2, dates].filter(Boolean).join("  |  ")));
      if (f.expPos2) paras.push(new Paragraph({ children: [new TextRun({ text: f.expPos2, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.expBullet2a) paras.push(docxBullet(f.expBullet2a));
      if (f.expBullet2b) paras.push(docxBullet(f.expBullet2b));
    }
    for (const e of extraExp) {
      const company = ex(e, "company");
      const pos = ex(e, "pos");
      if (!company && !pos) continue;
      paras.push(docxOrgLine(company, [ex(e, "loc"), dateRange(ex(e, "from"), ex(e, "to"))].filter(Boolean).join("  |  ")));
      if (pos) paras.push(new Paragraph({ children: [new TextRun({ text: pos, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (ex(e, "bullet1")) paras.push(docxBullet(ex(e, "bullet1")));
      if (ex(e, "bullet2")) paras.push(docxBullet(ex(e, "bullet2")));
      if (ex(e, "bullet3")) paras.push(docxBullet(ex(e, "bullet3")));
    }
  }

  // Projects
  if (f.project1 || f.project2 || extraProjects.some(p => ex(p, "text"))) {
    paras.push(docxSectionHeading("PROJECTS / EXTRA CURRICULAR ACTIVITIES"));
    if (f.project1) paras.push(docxBullet(f.project1));
    if (f.project2) paras.push(docxBullet(f.project2));
    for (const p of extraProjects) {
      const text = ex(p, "text");
      if (text) paras.push(docxBullet(text));
    }
  }

  // Skills
  const hasSkills = f.languages || f.computerSkills || f.researchSkills || f.technicalSkills || f.softSkills;
  if (hasSkills) {
    paras.push(docxSectionHeading("SKILLS"));
    if (f.languages) paras.push(docxLine("Languages", f.languages));
    if (f.computerSkills) paras.push(docxLine("Computer", f.computerSkills));
    if (f.researchSkills) paras.push(docxLine("Research", f.researchSkills));
    if (f.technicalSkills) paras.push(docxLine("Technical", f.technicalSkills));
    if (f.softSkills) paras.push(docxLine("Soft Skills", f.softSkills));
  }

  return paras;
}

function buildGlobalDocx(f: Record<string, string>, extras: ResumeExtras = {}): Paragraph[] {
  const paras: Paragraph[] = [];
  const extraExp = extras.exp ?? [];
  const extraLead = extras.lead ?? [];

  // Header
  const name = [f.firstName, f.lastName].filter(Boolean).join(" ");
  if (name) {
    paras.push(new Paragraph({
      children: [new TextRun({ text: name, bold: true, size: 40, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 }
    }));
  }
  const contactParts = [f.address, f.email, f.phone].filter(Boolean);
  if (contactParts.length) {
    paras.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join("  |  "), size: 19, font: "Calibri", color: "333333" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }));
  }

  // Education
  if (f.eduInst || f.eduDegree) {
    paras.push(docxSectionHeading("EDUCATION"));
    if (f.eduInst) paras.push(docxOrgLine(f.eduInst, f.eduLoc || ""));
    if (f.eduDegree) paras.push(new Paragraph({ children: [new TextRun({ text: f.eduDegree, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
    if (f.eduGpa) paras.push(new Paragraph({ children: [new TextRun({ text: `GPA: ${f.eduGpa}`, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
    if (f.eduGradDate) paras.push(new Paragraph({ children: [new TextRun({ text: `Expected: ${f.eduGradDate}`, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
    if (f.eduCoursework) paras.push(new Paragraph({ children: [new TextRun({ text: `Relevant Coursework: ${f.eduCoursework}`, size: 20, font: "Calibri" })], spacing: { after: 60 } }));
    
    if (f.abroadInst) {
      paras.push(docxOrgLine(f.abroadInst, [f.abroadLoc, f.abroadDates].filter(Boolean).join("  |  ")));
      if (f.abroadCourse) paras.push(new Paragraph({ children: [new TextRun({ text: `Coursework in ${f.abroadCourse}`, size: 20, font: "Calibri" })], spacing: { after: 60 } }));
    }
    if (f.hsName) {
      paras.push(docxOrgLine(f.hsName, [f.hsLoc, f.hsGradDate].filter(Boolean).join("  |  ")));
      if (f.hsDetails) paras.push(new Paragraph({ children: [new TextRun({ text: f.hsDetails, size: 20, font: "Calibri" })], spacing: { after: 60 } }));
    }
  }

  // Experience
  if (f.expOrg1 || f.expOrg2 || extraExp.some(e => ex(e, "org") || ex(e, "title"))) {
    paras.push(docxSectionHeading("EXPERIENCE"));
    if (f.expOrg1) {
      paras.push(docxOrgLine(f.expOrg1, [f.expLoc1, f.expDates1].filter(Boolean).join("  |  ")));
      if (f.expTitle1) paras.push(new Paragraph({ children: [new TextRun({ text: f.expTitle1, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.expB1a) paras.push(docxBullet(f.expB1a));
      if (f.expB1b) paras.push(docxBullet(f.expB1b));
      if (f.expB1c) paras.push(docxBullet(f.expB1c));
      if (f.expB1d) paras.push(docxBullet(f.expB1d));
    }
    if (f.expOrg2) {
      paras.push(docxOrgLine(f.expOrg2, [f.expLoc2, f.expDates2].filter(Boolean).join("  |  ")));
      if (f.expTitle2) paras.push(new Paragraph({ children: [new TextRun({ text: f.expTitle2, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (f.expB2a) paras.push(docxBullet(f.expB2a));
      if (f.expB2b) paras.push(docxBullet(f.expB2b));
      if (f.expB2c) paras.push(docxBullet(f.expB2c));
      if (f.expB2d) paras.push(docxBullet(f.expB2d));
    }
    for (const e of extraExp) {
      const org = ex(e, "org");
      const title = ex(e, "title");
      if (!org && !title) continue;
      paras.push(docxOrgLine(org, [ex(e, "loc"), ex(e, "dates")].filter(Boolean).join("  |  ")));
      if (title) paras.push(new Paragraph({ children: [new TextRun({ text: title, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (ex(e, "b1")) paras.push(docxBullet(ex(e, "b1")));
      if (ex(e, "b2")) paras.push(docxBullet(ex(e, "b2")));
      if (ex(e, "b3")) paras.push(docxBullet(ex(e, "b3")));
      if (ex(e, "b4")) paras.push(docxBullet(ex(e, "b4")));
    }
  }

  // Leadership
  if (f.leadOrg || f.leadRole || extraLead.some(l => ex(l, "org") || ex(l, "role"))) {
    paras.push(docxSectionHeading("LEADERSHIP & ACTIVITIES"));
    if (f.leadOrg) paras.push(docxOrgLine(f.leadOrg, [f.leadLoc, f.leadDates].filter(Boolean).join("  |  ")));
    if (f.leadRole) paras.push(new Paragraph({ children: [new TextRun({ text: f.leadRole, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
    if (f.leadB1) paras.push(docxBullet(f.leadB1));
    if (f.leadB2) paras.push(docxBullet(f.leadB2));
    for (const l of extraLead) {
      const org = ex(l, "org");
      const role = ex(l, "role");
      if (!org && !role) continue;
      paras.push(docxOrgLine(org, [ex(l, "loc"), ex(l, "dates")].filter(Boolean).join("  |  ")));
      if (role) paras.push(new Paragraph({ children: [new TextRun({ text: role, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      if (ex(l, "b1")) paras.push(docxBullet(ex(l, "b1")));
      if (ex(l, "b2")) paras.push(docxBullet(ex(l, "b2")));
    }
  }

  // Skills
  const hasSkills = f.technical || f.language || f.laboratory || f.interests;
  if (hasSkills) {
    paras.push(docxSectionHeading("SKILLS & INTERESTS"));
    if (f.technical) paras.push(docxLine("Technical", f.technical));
    if (f.language) paras.push(docxLine("Language", f.language));
    if (f.laboratory) paras.push(docxLine("Laboratory", f.laboratory));
    if (f.interests) paras.push(docxLine("Interests", f.interests));
  }

  return paras;
}

export async function generateResumeDocx(format: "local" | "global", formData: Record<string, string>, extras: ResumeExtras = {}): Promise<Buffer> {
  const safe: Record<string, string> = {};
  for (const key of Object.keys(formData)) {
    const val = formData[key];
    safe[key] = typeof val === "string" ? val.trim() : "";
  }

  const paragraphs = format === "local" ? buildLocalDocx(safe, extras) : buildGlobalDocx(safe, extras);

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
      },
      children: paragraphs,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
