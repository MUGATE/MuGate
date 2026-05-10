import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopPosition, TabStopType } from "docx";
/* ── Helpers ── */
const MARGIN = 54;
const PAGE_W = 612; // Letter width
const CONTENT_W = PAGE_W - MARGIN * 2;

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > 750) doc.addPage();
}

function drawHr(doc: PDFKit.PDFDocument, y?: number) {
  const atY = y ?? doc.y;
  doc.moveTo(MARGIN, atY).lineTo(PAGE_W - MARGIN, atY).lineWidth(0.75).strokeColor("#000000").stroke();
  doc.y = atY + 6;
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 28);
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000").text(title, MARGIN, doc.y, { width: CONTENT_W });
  drawHr(doc, doc.y + 2);
  doc.moveDown(0.15);
}

function bulletLine(doc: PDFKit.PDFDocument, text: string) {
  if (!text) return;
  ensureSpace(doc, 14);
  doc.font("Helvetica").fontSize(10).fillColor("#000000");
  doc.text(`•  ${text}`, MARGIN + 12, doc.y, { width: CONTENT_W - 12 });
}

function dateRange(from: string, to: string): string {
  if (from && to) return `${from} – ${to}`;
  if (from) return from;
  if (to) return to;
  return "";
}

/* ══════════════════════════════════════════════
   LOCAL CV  (AUB / Lebanon format)
   ══════════════════════════════════════════════ */
function buildLocalPdf(doc: PDFKit.PDFDocument, f: Record<string, string>) {
  // ── Header ──
  if (f.fullName) {
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#000000").text(f.fullName, MARGIN, MARGIN, { align: "center", width: CONTENT_W });
  }
  const contactParts: string[] = [];
  if (f.address) contactParts.push(f.address);
  if (f.phone) contactParts.push(f.phone);
  if (f.email) contactParts.push(f.email);
  if (f.linkedin) contactParts.push(f.linkedin);
  if (contactParts.length) {
    doc.font("Helvetica").fontSize(9.5).fillColor("#333333").text(contactParts.join("  |  "), MARGIN, doc.y + 2, { align: "center", width: CONTENT_W });
  }
  doc.moveDown(0.5);
  drawHr(doc);

  // ── Objective ──
  if (f.objective) {
    sectionTitle(doc, "OBJECTIVE / PROFILE");
    doc.font("Helvetica").fontSize(10).text(f.objective, MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.3);
  }

  // ── Education ──
  const hasEdu = f.eduInst1 || f.eduDegree1 || f.eduInst2;
  if (hasEdu) {
    sectionTitle(doc, "EDUCATION");

    if (f.eduInst1) {
      const dates = dateRange(f.eduFrom1, f.eduTo1);
      doc.font("Helvetica-Bold").fontSize(10).text(f.eduInst1, MARGIN, doc.y, { continued: false, width: CONTENT_W });
      if (f.eduLoc1 || dates) {
        const right = [f.eduLoc1, dates].filter(Boolean).join("  |  ");
        doc.font("Helvetica").fontSize(9).text(right, MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.eduDegree1) doc.font("Helvetica").fontSize(10).text(f.eduDegree1, MARGIN, doc.y, { width: CONTENT_W });
      if (f.eduMinor1) doc.font("Helvetica").fontSize(10).text(`Minor: ${f.eduMinor1}`, MARGIN, doc.y, { width: CONTENT_W });
      if (f.eduGradDate1) doc.font("Helvetica").fontSize(10).text(`Expected Graduation: ${f.eduGradDate1}`, MARGIN, doc.y, { width: CONTENT_W });
      if (f.eduCourses1) doc.font("Helvetica").fontSize(10).text(`Relevant Courses: ${f.eduCourses1}`, MARGIN, doc.y, { width: CONTENT_W });
      if (f.eduGpa1) doc.font("Helvetica").fontSize(10).text(`GPA / Honors: ${f.eduGpa1}`, MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.4);
    }

    if (f.eduInst2) {
      const dates2 = dateRange(f.eduFrom2, f.eduTo2);
      doc.font("Helvetica-Bold").fontSize(10).text(f.eduInst2, MARGIN, doc.y, { width: CONTENT_W });
      if (f.eduLoc2 || dates2) {
        const right = [f.eduLoc2, dates2].filter(Boolean).join("  |  ");
        doc.font("Helvetica").fontSize(9).text(right, MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.eduGpa2) doc.font("Helvetica").fontSize(10).text(`GPA / Honors: ${f.eduGpa2}`, MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.3);
    }
  }

  // ── Experience ──
  const hasExp = f.expCompany1 || f.expPos1 || f.expCompany2;
  if (hasExp) {
    sectionTitle(doc, "EXPERIENCE");

    if (f.expCompany1 || f.expPos1) {
      const dates = dateRange(f.expFrom1, f.expTo1);
      if (f.expCompany1) doc.font("Helvetica-Bold").fontSize(10).text(f.expCompany1, MARGIN, doc.y, { width: CONTENT_W });
      if (f.expLoc1 || dates) {
        doc.font("Helvetica").fontSize(9).text([f.expLoc1, dates].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.expPos1) doc.font("Helvetica-Oblique").fontSize(10).text(f.expPos1, MARGIN, doc.y, { width: CONTENT_W });
      bulletLine(doc, f.expBullet1a);
      bulletLine(doc, f.expBullet1b);
      bulletLine(doc, f.expBullet1c);
      doc.moveDown(0.4);
    }

    if (f.expCompany2 || f.expPos2) {
      const dates = dateRange(f.expFrom2, f.expTo2);
      if (f.expCompany2) doc.font("Helvetica-Bold").fontSize(10).text(f.expCompany2, MARGIN, doc.y, { width: CONTENT_W });
      if (f.expLoc2 || dates) {
        doc.font("Helvetica").fontSize(9).text([f.expLoc2, dates].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.expPos2) doc.font("Helvetica-Oblique").fontSize(10).text(f.expPos2, MARGIN, doc.y, { width: CONTENT_W });
      bulletLine(doc, f.expBullet2a);
      bulletLine(doc, f.expBullet2b);
      doc.moveDown(0.3);
    }
  }

  // ── Projects / Extra Curricular ──
  if (f.project1 || f.project2) {
    sectionTitle(doc, "PROJECTS / EXTRA CURRICULAR ACTIVITIES");
    bulletLine(doc, f.project1);
    bulletLine(doc, f.project2);
    doc.moveDown(0.3);
  }

  // ── Skills ──
  const hasSkills = f.languages || f.computerSkills || f.researchSkills || f.technicalSkills || f.softSkills;
  if (hasSkills) {
    sectionTitle(doc, "SKILLS");
    if (f.languages) { doc.font("Helvetica-Bold").fontSize(10).text("Languages: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.languages, { width: CONTENT_W }); }
    if (f.computerSkills) { doc.font("Helvetica-Bold").fontSize(10).text("Computer: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.computerSkills, { width: CONTENT_W }); }
    if (f.researchSkills) { doc.font("Helvetica-Bold").fontSize(10).text("Research: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.researchSkills, { width: CONTENT_W }); }
    if (f.technicalSkills) { doc.font("Helvetica-Bold").fontSize(10).text("Technical: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.technicalSkills, { width: CONTENT_W }); }
    if (f.softSkills) { doc.font("Helvetica-Bold").fontSize(10).text("Soft Skills: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.softSkills, { width: CONTENT_W }); }
  }
}

/* ══════════════════════════════════════════════
   GLOBAL CV  (Harvard format)
   ══════════════════════════════════════════════ */
function buildGlobalPdf(doc: PDFKit.PDFDocument, f: Record<string, string>) {
  // ── Header ──
  const name = [f.firstName, f.lastName].filter(Boolean).join(" ");
  if (name) {
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#000000").text(name, MARGIN, MARGIN, { align: "center", width: CONTENT_W });
  }
  const contactParts: string[] = [];
  if (f.address) contactParts.push(f.address);
  if (f.email) contactParts.push(f.email);
  if (f.phone) contactParts.push(f.phone);
  if (contactParts.length) {
    doc.font("Helvetica").fontSize(9.5).fillColor("#333333").text(contactParts.join("  |  "), MARGIN, doc.y + 2, { align: "center", width: CONTENT_W });
  }
  doc.moveDown(0.5);
  drawHr(doc);

  // ── Education ──
  const hasEdu = f.eduInst || f.eduDegree;
  if (hasEdu) {
    sectionTitle(doc, "EDUCATION");

    if (f.eduInst) {
      doc.font("Helvetica-Bold").fontSize(10).text(f.eduInst, MARGIN, doc.y, { continued: false, width: CONTENT_W });
      if (f.eduLoc) doc.font("Helvetica").fontSize(9).text(f.eduLoc, MARGIN, doc.y, { width: CONTENT_W, align: "right" });
    }
    if (f.eduDegree) doc.font("Helvetica").fontSize(10).text(f.eduDegree, MARGIN, doc.y, { width: CONTENT_W });
    if (f.eduGpa) doc.font("Helvetica").fontSize(10).text(`GPA: ${f.eduGpa}`, MARGIN, doc.y, { width: CONTENT_W });
    if (f.eduGradDate) doc.font("Helvetica").fontSize(10).text(`Expected: ${f.eduGradDate}`, MARGIN, doc.y, { width: CONTENT_W });
    if (f.eduCoursework) doc.font("Helvetica").fontSize(10).text(`Relevant Coursework: ${f.eduCoursework}`, MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.35);

    // Study abroad
    if (f.abroadInst) {
      doc.font("Helvetica-Bold").fontSize(10).text(f.abroadInst, MARGIN, doc.y, { width: CONTENT_W });
      if (f.abroadLoc || f.abroadDates) {
        doc.font("Helvetica").fontSize(9).text([f.abroadLoc, f.abroadDates].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.abroadCourse) doc.font("Helvetica").fontSize(10).text(`Coursework in ${f.abroadCourse}`, MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.35);
    }

    // High school
    if (f.hsName) {
      doc.font("Helvetica-Bold").fontSize(10).text(f.hsName, MARGIN, doc.y, { width: CONTENT_W });
      if (f.hsLoc || f.hsGradDate) {
        doc.font("Helvetica").fontSize(9).text([f.hsLoc, f.hsGradDate].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.hsDetails) doc.font("Helvetica").fontSize(10).text(f.hsDetails, MARGIN, doc.y, { width: CONTENT_W });
      doc.moveDown(0.3);
    }
  }

  // ── Experience ──
  const hasExp = f.expOrg1 || f.expTitle1 || f.expOrg2;
  if (hasExp) {
    sectionTitle(doc, "EXPERIENCE");

    if (f.expOrg1 || f.expTitle1) {
      if (f.expOrg1) doc.font("Helvetica-Bold").fontSize(10).text(f.expOrg1, MARGIN, doc.y, { width: CONTENT_W });
      if (f.expLoc1 || f.expDates1) {
        doc.font("Helvetica").fontSize(9).text([f.expLoc1, f.expDates1].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.expTitle1) doc.font("Helvetica-Oblique").fontSize(10).text(f.expTitle1, MARGIN, doc.y, { width: CONTENT_W });
      bulletLine(doc, f.expB1a);
      bulletLine(doc, f.expB1b);
      bulletLine(doc, f.expB1c);
      bulletLine(doc, f.expB1d);
      doc.moveDown(0.4);
    }

    if (f.expOrg2 || f.expTitle2) {
      if (f.expOrg2) doc.font("Helvetica-Bold").fontSize(10).text(f.expOrg2, MARGIN, doc.y, { width: CONTENT_W });
      if (f.expLoc2 || f.expDates2) {
        doc.font("Helvetica").fontSize(9).text([f.expLoc2, f.expDates2].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
      }
      if (f.expTitle2) doc.font("Helvetica-Oblique").fontSize(10).text(f.expTitle2, MARGIN, doc.y, { width: CONTENT_W });
      bulletLine(doc, f.expB2a);
      bulletLine(doc, f.expB2b);
      bulletLine(doc, f.expB2c);
      bulletLine(doc, f.expB2d);
      doc.moveDown(0.3);
    }
  }

  // ── Leadership & Activities ──
  if (f.leadOrg || f.leadRole) {
    sectionTitle(doc, "LEADERSHIP & ACTIVITIES");
    if (f.leadOrg) doc.font("Helvetica-Bold").fontSize(10).text(f.leadOrg, MARGIN, doc.y, { width: CONTENT_W });
    if (f.leadLoc || f.leadDates) {
      doc.font("Helvetica").fontSize(9).text([f.leadLoc, f.leadDates].filter(Boolean).join("  |  "), MARGIN, doc.y, { width: CONTENT_W, align: "right" });
    }
    if (f.leadRole) doc.font("Helvetica-Oblique").fontSize(10).text(f.leadRole, MARGIN, doc.y, { width: CONTENT_W });
    bulletLine(doc, f.leadB1);
    bulletLine(doc, f.leadB2);
    doc.moveDown(0.3);
  }

  // ── Skills & Interests ──
  const hasSkills = f.technical || f.language || f.laboratory || f.interests;
  if (hasSkills) {
    sectionTitle(doc, "SKILLS & INTERESTS");
    if (f.technical) { doc.font("Helvetica-Bold").fontSize(10).text("Technical: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.technical, { width: CONTENT_W }); }
    if (f.language) { doc.font("Helvetica-Bold").fontSize(10).text("Language: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.language, { width: CONTENT_W }); }
    if (f.laboratory) { doc.font("Helvetica-Bold").fontSize(10).text("Laboratory: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.laboratory, { width: CONTENT_W }); }
    if (f.interests) { doc.font("Helvetica-Bold").fontSize(10).text("Interests: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.interests, { width: CONTENT_W }); }
  }
}

/* ══════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════ */
export function generateResumePdf(format: "local" | "global", formData: Record<string, string>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Sanitize: default every value to empty string
    const safe: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      const val = formData[key];
      safe[key] = typeof val === "string" ? val.trim() : "";
    }

    if (format === "local") buildLocalPdf(doc, safe);
    else buildGlobalPdf(doc, safe);

    doc.end();
  });
}

/* ══════════════════════════════════════════════
   DOCX Generation
   ══════════════════════════════════════════════ */
const HALF_PAGE = 4680; // ~half page in twips for right-aligned tabs

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

function buildLocalDocx(f: Record<string, string>): Paragraph[] {
  const paras: Paragraph[] = [];

  // Header
  if (f.fullName) paras.push(new Paragraph({ children: [new TextRun({ text: f.fullName, bold: true, size: 36, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
  const contactParts = [f.address, f.phone, f.email, f.linkedin].filter(Boolean);
  if (contactParts.length) paras.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("  |  "), size: 19, font: "Calibri", color: "333333" })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));

  // Objective
  if (f.objective) {
    paras.push(docxSectionHeading("OBJECTIVE / PROFILE"));
    paras.push(new Paragraph({ children: [new TextRun({ text: f.objective, size: 20, font: "Calibri" })], spacing: { after: 80 } }));
  }

  // Education
  if (f.eduInst1 || f.eduInst2) {
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
  }

  // Experience
  if (f.expCompany1 || f.expCompany2) {
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
  }

  // Projects
  if (f.project1 || f.project2) {
    paras.push(docxSectionHeading("PROJECTS / EXTRA CURRICULAR ACTIVITIES"));
    if (f.project1) paras.push(docxBullet(f.project1));
    if (f.project2) paras.push(docxBullet(f.project2));
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

function buildGlobalDocx(f: Record<string, string>): Paragraph[] {
  const paras: Paragraph[] = [];

  // Header
  const name = [f.firstName, f.lastName].filter(Boolean).join(" ");
  if (name) paras.push(new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 40, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
  const contactParts = [f.address, f.email, f.phone].filter(Boolean);
  if (contactParts.length) paras.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("  |  "), size: 19, font: "Calibri", color: "333333" })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));

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
  if (f.expOrg1 || f.expOrg2) {
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
  }

  // Leadership
  if (f.leadOrg || f.leadRole) {
    paras.push(docxSectionHeading("LEADERSHIP & ACTIVITIES"));
    if (f.leadOrg) paras.push(docxOrgLine(f.leadOrg, [f.leadLoc, f.leadDates].filter(Boolean).join("  |  ")));
    if (f.leadRole) paras.push(new Paragraph({ children: [new TextRun({ text: f.leadRole, italics: true, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
    if (f.leadB1) paras.push(docxBullet(f.leadB1));
    if (f.leadB2) paras.push(docxBullet(f.leadB2));
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

export async function generateResumeDocx(format: "local" | "global", formData: Record<string, string>): Promise<Buffer> {
  const safe: Record<string, string> = {};
  for (const key of Object.keys(formData)) {
    const val = formData[key];
    safe[key] = typeof val === "string" ? val.trim() : "";
  }

  const paragraphs = format === "local" ? buildLocalDocx(safe) : buildGlobalDocx(safe);

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

/* ══════════════════════════════════════════════
   AI DOCUMENT EDITING
   ══════════════════════════════════════════════ */

/**
 * Applies AI-specified edits to an uploaded resume document.
 * For DOCX: uses mammoth to convert to HTML, applies text replacements, converts back.
 * For PDF: extracts text, applies replacements, returns a new PDF with modified text.
 *
 * This is a pragmatic approach — for full formatting preservation,
 * a more advanced solution would be needed, but this handles common edits
 * like email/phone changes, section updates, etc.
 */
export async function editResumeDocument(
  file: Express.Multer.File,
  instructions: string
): Promise<Buffer> {
  const ext = file.originalname.toLowerCase().split(".").pop();

  if (ext === "docx" || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return editDocx(file.buffer, instructions);
  } else if (ext === "pdf" || file.mimetype === "application/pdf") {
    return editPdf(file.buffer, instructions);
  } else {
    throw new Error(`Unsupported file type: ${ext}. Only PDF and DOCX are supported.`);
  }
}

/**
 * Parse edit instructions in the format:
 * "change [old text] to [new text]" or "replace [old] with [new]"
 * Also supports: "update email to new@email.com"
 */
function parseInstructions(instructions: string): Array<{ from: string; to: string }> {
  const edits: Array<{ from: string; to: string }> = [];

  // Pattern 1: "change X to Y" or "replace X with Y"
  const changeRegex = /(?:change|replace|update)\s+"([^"]+)"\s+(?:to|with)\s+"([^"]+)"/gi;
  let match;
  while ((match = changeRegex.exec(instructions)) !== null) {
    edits.push({ from: match[1].trim(), to: match[2].trim() });
  }

  // Pattern 2: "change X to Y" (without quotes)
  const simpleRegex = /(?:change|replace|update)\s+([a-zA-Z0-9@._+\-]+)\s+(?:to|with)\s+([a-zA-Z0-9@._+\-]+)/gi;
  while ((match = simpleRegex.exec(instructions)) !== null) {
    // Avoid duplicates with quoted matches
    const from = match[1].trim();
    const to = match[2].trim();
    if (!edits.some(e => e.from === from)) {
      edits.push({ from, to });
    }
  }

  return edits;
}

async function editDocx(buffer: Buffer, instructions: string): Promise<Buffer> {
  const mammoth = await import("mammoth");

  // Convert to HTML (preserves formatting)
  const result = await mammoth.convertToHtml({ buffer });
  let html = result.value;

  // Parse and apply edits
  const edits = parseInstructions(instructions);

  for (const edit of edits) {
    // Escape special regex characters in the search string
    const escapedFrom = edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(escapedFrom, "gi"), edit.to);
  }

  // Convert HTML back to DOCX preserving formatting (bold, italic, headings, lists)
  const { Document: DocxDoc, Packer: DocxPacker, Paragraph: DocxParagraph, TextRun: DocxTextRun, HeadingLevel: DocxHeadingLevel, AlignmentType: DocxAlignmentType } = await import("docx");

  const paragraphs = htmlToDocxParagraphs(html);
  const newDoc = new DocxDoc({
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
      },
      children: paragraphs,
    }],
  });

  return Buffer.from(await DocxPacker.toBuffer(newDoc));
}

/**
 * Parse HTML (from mammoth) into docx-compatible paragraphs, preserving formatting.
 * Handles: h1-h6, p, strong/b, em/i, u, a, ul/ol/li, br, tables
 */
function htmlToDocxParagraphs(html: string): Paragraph[] {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");
  const paragraphs: any[] = [];

  // Split HTML into block-level elements
  const blockRegex = /<(h[1-6]|p|ul|ol|li|blockquote|div|table|tr|td|th|pre)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  const textParts = html.split(blockRegex);

  // Also handle bare text lines (between block elements)
  const lines = html.replace(/<br\s*\/?>/gi, "\n").split("\n");

  // Process block elements from the matched groups
  let lastIndex = 0;
  let match;

  // Reset regex
  blockRegex.lastIndex = 0;

  const blocks: Array<{ type: string; content: string }> = [];

  while ((match = blockRegex.exec(html)) !== null) {
    const type = match[1].toLowerCase();
    const content = match[2];
    blocks.push({ type, content });
  }

  // If no block elements found, treat entire content as paragraphs
  if (blocks.length === 0) {
    // Split by double newlines for paragraph breaks
    const textLines = html.replace(/<[^>]*>/g, "").split(/\n\s*\n/);
    for (const line of textLines) {
      const trimmed = line.trim();
      if (trimmed) {
        paragraphs.push(createFormattedParagraph(trimmed));
      }
    }
    return paragraphs;
  }

  // Process each block
  let inList = false;
  let listType: "bullet" | "number" = "bullet";

  for (const block of blocks) {
    if (block.type === "ul" || block.type === "ol") {
      listType = block.type === "ol" ? "number" : "bullet";
      inList = true;

      // Extract li items from within the list
      const liRegex = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(block.content)) !== null) {
        const liContent = extractFormattedText(liMatch[1]);
        paragraphs.push(
          new Paragraph({
            children: liContent,
            bullet: listType === "bullet" ? { level: 0 } : undefined,
            numbering: listType === "number" ? { reference: "default", level: 0 } : undefined,
            spacing: { after: 40 },
          })
        );
      }
      inList = false;
      continue;
    }

    if (block.type === "li") {
      const liContent = extractFormattedText(block.content);
      paragraphs.push(
        new Paragraph({
          children: liContent,
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      );
      continue;
    }

    if (block.type === "h1" || block.type === "h2" || block.type === "h3") {
      const headingLevel = block.type === "h1" ? HeadingLevel.HEADING_1 : block.type === "h2" ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      const headingContent = extractFormattedText(block.content);
      paragraphs.push(
        new Paragraph({
          children: headingContent,
          heading: headingLevel,
          spacing: { before: 200, after: 80 },
        })
      );
      continue;
    }

    if (block.type === "h4" || block.type === "h5" || block.type === "h6") {
      const content = extractFormattedText(block.content);
      paragraphs.push(
        new Paragraph({
          children: content.map((run: any) => {
            // Make headings bold even if h4-h6
            return new TextRun({
              text: run.text,
              bold: true,
              size: block.type === "h4" ? "22" : "20",
              font: "Calibri",
            });
          }),
          spacing: { before: 120, after: 60 },
        })
      );
      continue;
    }

    if (block.type === "p" || block.type === "div" || block.type === "blockquote") {
      const pContent = extractFormattedText(block.content);
      if (pContent.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: pContent,
            spacing: { after: 60 },
            indent: block.type === "blockquote" ? { left: 720 } : undefined,
          })
        );
      }
      continue;
    }

    if (block.type === "table") {
      // For tables, extract rows and cells as simple text
      const cellTexts: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(block.content)) !== null) {
        cellTexts.push(stripHtml(cellMatch[1]));
      }
      if (cellTexts.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: cellTexts.join(" | "), size: 20, font: "Calibri" })],
            spacing: { after: 40 },
          })
        );
      }
      continue;
    }
  }

  return paragraphs;
}

/**
 * Extract formatted text runs from HTML content, preserving bold/italic/underline.
 */
function extractFormattedText(html: string): any[] {
  const { TextRun } = require("docx");
  const runs: any[] = [];

  // Process inline elements: <strong>, <code>, <b>, <em>, <i>, <code>, <u>, <a>, <span>
  // Split by inline tags
  const inlineRegex = /<(strong|b|em|i|u|a|span|code)(?:\s[^>]*)?>([\s\S]*?)<\/(?:strong|b|em|i|u|a|span|code)>/gi;
  let lastIdx = 0;
  let match;

  // Collect all text segments with their formatting
  const segments: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean; link?: string }> = [];

  // First, extract any text before the first tag
  const allInlineMatches: Array<{ index: number; tag: string; content: string; full: string; bold: boolean; italic: boolean; underline: boolean; link: string }> = [];

  while ((match = inlineRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    allInlineMatches.push({
      index: match.index,
      tag,
      content,
      full: match[0],
      bold: tag === "strong" || tag === "b",
      italic: tag === "em" || tag === "i",
      underline: tag === "u",
      link: tag === "a" ? (match[0].match(/href="([^"]+)"/)?.[1] || "") : "",
    });
  }

  // Build segments from inline matches and surrounding text
  let cursor = 0;
  for (const m of allInlineMatches) {
    // Text before this tag
    if (m.index > cursor) {
      const beforeText = stripHtml(html.substring(cursor, m.index));
      if (beforeText.trim()) {
        segments.push({ text: beforeText });
      }
    }
    segments.push({
      text: stripHtml(m.content),
      bold: m.bold,
      italic: m.italic,
      underline: m.underline,
      link: m.link || undefined,
    });
    cursor = m.index + m.full.length;
  }

  // Remaining text after last tag
  if (cursor < html.length) {
    const remaining = stripHtml(html.substring(cursor));
    if (remaining.trim()) {
      segments.push({ text: remaining });
    }
  }

  // If no inline tags found, just push the stripped text
  if (segments.length === 0) {
    const clean = stripHtml(html);
    if (clean.trim()) {
      segments.push({ text: clean });
    }
  }

  // Create TextRun for each segment
  for (const seg of segments) {
    if (!seg.text.trim()) continue;
    runs.push(
      new TextRun({
        text: seg.text,
        bold: seg.bold || false,
        italics: seg.italic || false,
        underline: seg.underline ? { type: "single" } : undefined,
        size: 20,
        font: "Calibri",
      })
    );
  }

  return runs;
}

/**
 * Strip HTML tags from text, decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Create a simple formatted paragraph from plain text
 */
function createFormattedParagraph(text: string): any {
  const { Paragraph, TextRun } = require("docx");
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Calibri" })],
    spacing: { after: 60 },
  });
}

async function editPdf(buffer: Buffer, instructions: string): Promise<Buffer> {
  // Strategy: Use Playwright (headless Chromium) to create a professional PDF
  // that mimics a resume layout with proper fonts, spacing, and structure.
  // Playwright generates PDFs with excellent formatting preservation.

  // First, extract text to know what we're working with
  const pdfParse = await import("pdf-parse");
  const path = await import("path");
  const { pathToFileURL } = await import("url");

  try {
    // Try to extract text for context about the document
  const workerPath = path.default.join(
    path.default.dirname(require.resolve("pdf-parse")),
    "pdf.worker.mjs"
  );

    // pdf-parse v2 uses a different API:
    // const parser = new pdfParse.default({ data: buffer, url: workerUrl, verbosity: 0 });
    // But since worker may not be found, let's use a robust approach with try/catch

    let text = "";
    try {
      // Use pdf-parse with the worker
      const workerUrl = pathToFileURL(workerPath).href;
      const parser = new (pdfParse as any).default({ data: buffer, url: workerUrl, verbosity: 0 });
  const result = await parser.getText();
      text = result?.text || "";
    } catch {
      try {
        // Fallback for pdf-parse v1 API
        const parser = new (pdfParse as any)(buffer);
        const result = await parser.getText();
        text = result?.text || "";
      } catch {
        // If all parsing fails, try getting text from buffer directly
        text = buffer.toString("utf8").replace(/[^\x20-\x7E\n]/g, " ").substring(0, 5000);
      }
    }

    // Apply edits to the text
  const edits = parseInstructions(instructions);
  for (const edit of edits) {
    const escapedFrom = edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escapedFrom, "gi"), edit.to);
  }

    // Generate a well-formatted PDF using Playwright
    return await generateProfessionalPdf(text);
  } catch (parseError) {
    // If everything fails, try a simpler approach
    console.error("PDF edit error, using fallback:", parseError);
    return editPdfFallback(buffer, instructions);
  }
}

/**
 * Generate a professionally formatted PDF from text using Playwright
 * This preserves the resume structure with proper fonts, formatting, and layout
 */
async function generateProfessionalPdf(text: string): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const lines = text.split("\n").filter((l: string) => l.trim());

  // Build an HTML resume that looks professional
  let htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0.75in; size: letter; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Calibri', 'Arial', 'Helvetica', sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    line-height: 1.4;
    padding: 0;
  }
  .resume-page {
    max-width: 7.5in;
    margin: 0 auto;
  }
  .header {
    text-align: center;
    margin-bottom: 12pt;
  }
  .header .name {
    font-size: 18pt;
    font-weight: bold;
    color: #000;
    margin-bottom: 2pt;
  }
  .header .contact {
    font-size: 9.5pt;
    color: #444;
  }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 10pt;
    margin-bottom: 4pt;
    border-bottom: 0.75pt solid #000;
    padding-bottom: 2pt;
  }
  .bullet {
    margin-left: 14pt;
    font-size: 10pt;
    padding-left: 8pt;
    margin-bottom: 2pt;
  }
  .bullet::before {
    content: "\\2022";
    position: absolute;
    margin-left: -14pt;
  }
  .skill-line { font-size: 10pt; margin-bottom: 1pt; }
  .skill-label { font-weight: bold; }
  p { margin-bottom: 4pt; font-size: 10pt; }
  strong { font-weight: bold; }
  em { font-style: italic; }
</style>
</head>
<body>
<div class="resume-page">`;

  let headerClosed = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
      // Detect section headers
    const isAllCaps = line === line.toUpperCase() && line.length < 50 && line.length > 3;
    const isSectionTitle = isAllCaps || /^(education|experience|skills|objective|profile|projects|leadership|interests|summary|work|employment|certifications|languages)$/i.test(line);

    if (!headerClosed && i < 3 && !isSectionTitle) {
      // First few lines are likely header info
      if (i === 0) {
        htmlContent += `<div class="header"><div class="name">${escapeHtml(line)}</div>`;
      } else {
        htmlContent += `<div class="contact">${escapeHtml(line)}</div>`;
      }
      if (i === 2 || i === lines.length - 1) {
        htmlContent += `</div>`;
        headerClosed = true;
    }
      continue;
}

    if (!headerClosed) {
      htmlContent += `</div>`;
      headerClosed = true;
    }

    if (isSectionTitle) {
      htmlContent += `<div class="section-title">${escapeHtml(line)}</div>`;
      continue;
    }

    // Detect bullet points
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("▪")) {
      htmlContent += `<div class="bullet">${escapeHtml(line.replace(/^[•\-\*▪]\s*/, ""))}</div>`;
      continue;
    }

    // Detect lines with ":" which are often label: value pairs
    if (line.includes(":") && line.length < 80) {
      const colonIdx = line.indexOf(":");
      const label = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      htmlContent += `<div class="skill-line"><span class="skill-label">${escapeHtml(label)}:</span> ${escapeHtml(value)}</div>`;
      continue;
    }

    // Regular paragraph text
    htmlContent += `<p>${escapeHtml(line)}</p>`;
  }

  if (!headerClosed) {
    htmlContent += `</div>`;
  }

  htmlContent += `</div></body></html>`;

  // Generate PDF using Playwright
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      margin: { top: "0.75in", bottom: "0.75in", left: "0.75in", right: "0.75in" },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Fallback PDF editor using PDFKit when Playwright is unavailable
 * Uses improved formatting with proper resume structure detection
 */
async function editPdfFallback(buffer: Buffer, instructions: string): Promise<Buffer> {
  const path = await import("path");
  const { pathToFileURL } = await import("url");

  // Try to extract text from PDF
  let text = "";
  try {
    const pdfParse = await import("pdf-parse");
  const workerPath = path.default.join(
    path.default.dirname(require.resolve("pdf-parse")),
    "pdf.worker.mjs"
  );
    const workerUrl = pathToFileURL(workerPath).href;
    const parser = new (pdfParse as any).default({ data: buffer, url: workerUrl, verbosity: 0 });
  const result = await parser.getText();
    text = result?.text || "";
  } catch {
    // Fallback: try to get text directly from buffer
    text = buffer.toString("utf8").replace(/[^\x20-\x7E\n]/g, " ").substring(0, 5000);
  }

  // Apply edits
  const edits = parseInstructions(instructions);
  for (const edit of edits) {
    const escapedFrom = edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escapedFrom, "gi"), edit.to);
  }

  // Create a new PDF with the edited text using PDFKit
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const lines = text.split("\n").filter(l => l.trim());
    let inHeader = true;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        doc.moveDown(0.3);
        continue;
      }

      // Detect section headers
      const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length < 50 && trimmed.length > 3;
      const isSectionTitle = isAllCaps || /^(education|experience|skills|objective|profile|projects|leadership|interests|summary|work|employment|certifications|languages)$/i.test(trimmed);

      if (inHeader && !isSectionTitle && doc.y < 120) {
        // Header area
        continue;
      }
      inHeader = false;

      if (isSectionTitle) {
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").fontSize(11).text(trimmed);
        doc.moveDown(0.1);
        const currentY = doc.y;
        doc.moveTo(54, currentY).lineTo(558, currentY).lineWidth(0.75).strokeColor("#000000").stroke();
        doc.moveDown(0.2);
        doc.font("Helvetica").fontSize(10);
      } else if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
        // Bullet point
        doc.font("Helvetica").fontSize(10);
        doc.text(`•  ${trimmed.replace(/^[•\-\*]\s*/, "")}`, 66, doc.y, { width: 492 });
      } else if (trimmed.includes(":") && trimmed.length < 80) {
        // Label: value pair
        const colonIdx = trimmed.indexOf(":");
        const label = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();
        doc.font("Helvetica-Bold").fontSize(10).text(`${label}: `, 54, doc.y, { continued: true });
        doc.font("Helvetica").fontSize(10).text(value);
      } else {
        doc.font("Helvetica").fontSize(10).text(trimmed, 54, doc.y, { width: 504 });
      }
    }

    doc.end();
  });
}

