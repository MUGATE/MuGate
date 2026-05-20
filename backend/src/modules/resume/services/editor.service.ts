import { Document as DocxDoc, Packer as DocxPacker, Paragraph as DocxParagraph, TextRun as DocxTextRun, HeadingLevel as DocxHeadingLevel } from "docx";

// ── Helpers ──
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
    const from = match[1].trim();
    const to = match[2].trim();
    if (!edits.some(e => e.from === from)) {
      edits.push({ from, to });
    }
  }

  return edits;
}

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createFormattedParagraph(text: string): any {
  return new DocxParagraph({
    children: [new DocxTextRun({ text, size: 20, font: "Calibri" })],
    spacing: { after: 60 },
  });
}

function extractFormattedText(html: string): any[] {
  const runs: any[] = [];
  const inlineRegex = /<(strong|b|em|i|u|a|span|code)(?:\s[^>]*)?>([\s\S]*?)<\/(?:strong|b|em|i|u|a|span|code)>/gi;
  let match;

  const segments: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean; link?: string }> = [];
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

  let cursor = 0;
  for (const m of allInlineMatches) {
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

  if (cursor < html.length) {
    const remaining = stripHtml(html.substring(cursor));
    if (remaining.trim()) {
      segments.push({ text: remaining });
    }
  }

  if (segments.length === 0) {
    const clean = stripHtml(html);
    if (clean.trim()) {
      segments.push({ text: clean });
    }
  }

  for (const seg of segments) {
    if (!seg.text.trim()) continue;
    runs.push(
      new DocxTextRun({
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

function htmlToDocxParagraphs(html: string): DocxParagraph[] {
  const paragraphs: any[] = [];
  const blockRegex = /<(h[1-6]|p|ul|ol|li|blockquote|div|table|tr|td|th|pre)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  const blocks: Array<{ type: string; content: string }> = [];
  let match;

  while ((match = blockRegex.exec(html)) !== null) {
    const type = match[1].toLowerCase();
    const content = match[2];
    blocks.push({ type, content });
  }

  if (blocks.length === 0) {
    const textLines = html.replace(/<[^>]*>/g, "").split(/\n\s*\n/);
    for (const line of textLines) {
      const trimmed = line.trim();
      if (trimmed) {
        paragraphs.push(createFormattedParagraph(trimmed));
      }
    }
    return paragraphs;
  }

  let listType: "bullet" | "number" = "bullet";

  for (const block of blocks) {
    if (block.type === "ul" || block.type === "ol") {
      listType = block.type === "ol" ? "number" : "bullet";
      const liRegex = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(block.content)) !== null) {
        const liContent = extractFormattedText(liMatch[1]);
        paragraphs.push(
          new DocxParagraph({
            children: liContent,
            bullet: listType === "bullet" ? { level: 0 } : undefined,
            numbering: listType === "number" ? { reference: "default", level: 0 } : undefined,
            spacing: { after: 40 },
          })
        );
      }
      continue;
    }

    if (block.type === "li") {
      const liContent = extractFormattedText(block.content);
      paragraphs.push(
        new DocxParagraph({
          children: liContent,
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      );
      continue;
    }

    if (block.type === "h1" || block.type === "h2" || block.type === "h3") {
      const headingLevel = block.type === "h1" ? DocxHeadingLevel.HEADING_1 : block.type === "h2" ? DocxHeadingLevel.HEADING_2 : DocxHeadingLevel.HEADING_3;
      const headingContent = extractFormattedText(block.content);
      paragraphs.push(
        new DocxParagraph({
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
        new DocxParagraph({
          children: content.map((run: any) => {
            return new DocxTextRun({
              text: run.text,
              bold: true,
              size: block.type === "h4" ? 22 : 20,
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
          new DocxParagraph({
            children: pContent,
            spacing: { after: 60 },
            indent: block.type === "blockquote" ? { left: 720 } : undefined,
          })
        );
      }
      continue;
    }

    if (block.type === "table") {
      const cellTexts: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(block.content)) !== null) {
        cellTexts.push(stripHtml(cellMatch[1]));
      }
      if (cellTexts.length > 0) {
        paragraphs.push(
          new DocxParagraph({
            children: [new DocxTextRun({ text: cellTexts.join(" | "), size: 20, font: "Calibri" })],
            spacing: { after: 40 },
          })
        );
      }
      continue;
    }
  }

  return paragraphs;
}

// ── PDF/DOCX Editing Service Implementations ──

async function editDocx(buffer: Buffer, instructions: string): Promise<Buffer> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ buffer });
  let html = result.value;

  const edits = parseInstructions(instructions);
  for (const edit of edits) {
    const escapedFrom = edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(escapedFrom, "gi"), edit.to);
  }

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

async function generateProfessionalPdf(text: string): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const lines = text.split("\n").filter((l: string) => l.trim());

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
    const isAllCaps = line === line.toUpperCase() && line.length < 50 && line.length > 3;
    const isSectionTitle = isAllCaps || /^(education|experience|skills|objective|profile|projects|leadership|interests|summary|work|employment|certifications|languages)$/i.test(line);

    if (!headerClosed && i < 3 && !isSectionTitle) {
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

    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("▪")) {
      htmlContent += `<div class="bullet">${escapeHtml(line.replace(/^[•\-\*▪]\s*/, ""))}</div>`;
      continue;
    }

    if (line.includes(":") && line.length < 80) {
      const colonIdx = line.indexOf(":");
      const label = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      htmlContent += `<div class="skill-line"><span class="skill-label">${escapeHtml(label)}:</span> ${escapeHtml(value)}</div>`;
      continue;
    }

    htmlContent += `<p>${escapeHtml(line)}</p>`;
  }

  if (!headerClosed) {
    htmlContent += `</div>`;
  }

  htmlContent += `</div></body></html>`;

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

async function editPdfFallback(buffer: Buffer, instructions: string): Promise<Buffer> {
  const path = await import("path");
  const { pathToFileURL } = await import("url");

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
    text = buffer.toString("utf8").replace(/[^\x20-\x7E\n]/g, " ").substring(0, 5000);
  }

  const edits = parseInstructions(instructions);
  for (const edit of edits) {
    const escapedFrom = edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escapedFrom, "gi"), edit.to);
  }

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

      const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length < 50 && trimmed.length > 3;
      const isSectionTitle = isAllCaps || /^(education|experience|skills|objective|profile|projects|leadership|interests|summary|work|employment|certifications|languages)$/i.test(trimmed);

      if (inHeader && !isSectionTitle && doc.y < 120) {
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
        doc.font("Helvetica").fontSize(10);
        doc.text(`•  ${trimmed.replace(/^[•\-\*]\s*/, "")}`, 66, doc.y, { width: 492 });
      } else if (trimmed.includes(":") && trimmed.length < 80) {
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

async function editPdf(buffer: Buffer, instructions: string): Promise<Buffer> {
  const pdfParse = await import("pdf-parse");
  const path = await import("path");
  const { pathToFileURL } = await import("url");

  try {
    const workerPath = path.default.join(
      path.default.dirname(require.resolve("pdf-parse")),
      "pdf.worker.mjs"
    );

    let text = "";
    try {
      const workerUrl = pathToFileURL(workerPath).href;
      const parser = new (pdfParse as any).default({ data: buffer, url: workerUrl, verbosity: 0 });
      const result = await parser.getText();
      text = result?.text || "";
    } catch {
      try {
        const parser = new (pdfParse as any)(buffer);
        const result = await parser.getText();
        text = result?.text || "";
      } catch {
        text = buffer.toString("utf8").replace(/[^\x20-\x7E\n]/g, " ").substring(0, 5000);
      }
    }

    const edits = parseInstructions(instructions);
    for (const edit of edits) {
      const escapedFrom = edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(escapedFrom, "gi"), edit.to);
    }

    return await generateProfessionalPdf(text);
  } catch (parseError) {
    console.error("PDF edit error, using fallback:", parseError);
    return editPdfFallback(buffer, instructions);
  }
}

/* ── PUBLIC ENTRY POINT ── */
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
