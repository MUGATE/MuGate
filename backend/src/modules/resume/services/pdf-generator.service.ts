import PDFDocument from "pdfkit";

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

/* ── LOCAL CV DRAWING (AUB / Lebanon format) ── */
function buildLocalPdf(doc: PDFKit.PDFDocument, f: Record<string, string>) {
  // Header
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

  // Objective
  if (f.objective) {
    sectionTitle(doc, "OBJECTIVE / PROFILE");
    doc.font("Helvetica").fontSize(10).text(f.objective, MARGIN, doc.y, { width: CONTENT_W });
    doc.moveDown(0.3);
  }

  // Education
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

  // Experience
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

  // Projects / Extra Curricular
  if (f.project1 || f.project2) {
    sectionTitle(doc, "PROJECTS / EXTRA CURRICULAR ACTIVITIES");
    bulletLine(doc, f.project1);
    bulletLine(doc, f.project2);
    doc.moveDown(0.3);
  }

  // Skills
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

/* ── GLOBAL CV DRAWING (Harvard format) ── */
function buildGlobalPdf(doc: PDFKit.PDFDocument, f: Record<string, string>) {
  // Header
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

  // Education
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

  // Experience
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

  // Leadership & Activities
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

  // Skills & Interests
  const hasSkills = f.technical || f.language || f.laboratory || f.interests;
  if (hasSkills) {
    sectionTitle(doc, "SKILLS & INTERESTS");
    if (f.technical) { doc.font("Helvetica-Bold").fontSize(10).text("Technical: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.technical, { width: CONTENT_W }); }
    if (f.language) { doc.font("Helvetica-Bold").fontSize(10).text("Language: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.language, { width: CONTENT_W }); }
    if (f.laboratory) { doc.font("Helvetica-Bold").fontSize(10).text("Laboratory: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.laboratory, { width: CONTENT_W }); }
    if (f.interests) { doc.font("Helvetica-Bold").fontSize(10).text("Interests: ", MARGIN, doc.y, { continued: true }); doc.font("Helvetica").text(f.interests, { width: CONTENT_W }); }
  }
}

/* ── PUBLIC ENDPOINT wrapper ── */
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

    // Sanitize values
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
