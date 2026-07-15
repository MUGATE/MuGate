/**
 * Integration test for POST /api/resume/convert-base64
 * Run: npx ts-node scripts/test-convert-base64.ts
 */
import { Document, Packer, Paragraph, TextRun } from "docx";
import http from "http";

async function createSampleDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Mohammad Joumaa — Software Engineer. Five years building React and Node.js applications. BS Computer Science, Lebanese University. Skills: TypeScript, PostgreSQL, AWS.",
              }),
            ],
          }),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

function postJson(path: string, body: object): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, data: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const buffer = await createSampleDocx();
  const base64 = buffer.toString("base64");
  console.log(`Sample DOCX: ${buffer.length} bytes`);

  const { status, data } = await postJson("/api/resume/convert-base64", {
    base64,
    originalName: "test-resume.docx",
    template: "local",
  });

  console.log("Status:", status);
  if (status !== 200 || !data?.success) {
    console.error("FAILED:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const textLen = String(data.text ?? "").length;
  const hasResume = data.resume && typeof data.resume === "object";
  console.log("Text length:", textLen);
  console.log("Has structured resume:", hasResume);
  console.log("Text preview:", String(data.text).slice(0, 120));

  if (textLen < 20 || !hasResume) {
    console.error("FAILED: response missing expected content");
    process.exit(1);
  }

  console.log("PASS: convert-base64 works end-to-end");

  const analyze = await postJson("/api/resume/analyze", {
    resumeText: data.text,
  });
  if (analyze.status !== 200 || !analyze.data?.success) {
    console.error("ANALYZE FAILED:", JSON.stringify(analyze.data, null, 2));
    process.exit(1);
  }
  console.log("Analyze score:", analyze.data.analysis?.overallScore);
  console.log("PASS: convert → analyze chain works");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
