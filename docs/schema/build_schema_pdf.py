"""
Build MuGate full-project relational schema PDF from Mermaid ER sources.

Renders each .mmd via @mermaid-js/mermaid-cli, adds a cover page, merges into one PDF.
Source of truth: MuGate/supabase/migrations/20260714120000_mugate_schema.sql
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "rendered"
FINAL_PDF = Path(__file__).resolve().parents[1] / "MuGate-Full-Project-Relational-Schema.pdf"

PAGES = [
    ("01-overview.mmd", "Page 1 — Full Schema Relationship Overview"),
    ("02-auth-users.mmd", "Page 2 — Auth / Users"),
    ("03-academic.mmd", "Page 3 — Academic"),
    ("04-chat.mmd", "Page 4 — MuChat"),
    ("05-knowledge-admin.mmd", "Page 5 — Knowledge Base / Admin Scraper"),
    ("06-capstone-intern-events.mmd", "Page 6 — Capstone, Internships & Events"),
]

SOURCE_NOTE = (
    "Derived from live Capstone-v2 / MuGate PostgreSQL schema: "
    "supabase/migrations/20260714120000_mugate_schema.sql "
    "(plus unique-constraint migration). Legacy SQL Server DDL under "
    "backend/src/core/database/migrations/ is the historical source; "
    "Supabase migration is the product DB source of truth."
)

TABLE_GROUPS = [
    ("Auth / Users", "Users, PortalCredentials, Sessions, Admins"),
    ("Academic", "Courses, CourseSections, AcademicHistory, Schedules, ScheduleSections, UserRoadmap"),
    ("MuChat", "ChatSessions, ChatMessages, ChatAnalytics"),
    ("Knowledge / Admin", "KnowledgePages, KnowledgeChunks, ScraperRuns, ScrapeQueue"),
    ("Capstone", "CapstonePartners, CapstoneIdeas"),
    ("Internships", "Companies, InternshipReviews"),
    ("Events", "Events"),
]


def make_cover(path: Path) -> None:
    w, h = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=landscape(letter))

    c.setFillColorRGB(0.08, 0.12, 0.18)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColorRGB(0.95, 0.96, 0.98)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 1.05 * inch, "MuGate")

    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(w / 2, h - 1.5 * inch, "Full-Project Relational Schema")

    c.setFont("Helvetica", 11)
    c.setFillColorRGB(0.75, 0.80, 0.88)
    c.drawCentredString(
        w / 2,
        h - 1.9 * inch,
        "Capstone-v2 / MuGate · ER / Database Schema View · PostgreSQL (Supabase)",
    )

    c.setStrokeColorRGB(0.35, 0.55, 0.85)
    c.setLineWidth(1.5)
    c.line(1.5 * inch, h - 2.15 * inch, w - 1.5 * inch, h - 2.15 * inch)

    # Two columns: table groups | pages + notes
    left_x = 1.5 * inch
    right_x = w / 2 + 0.2 * inch

    c.setFillColorRGB(0.92, 0.94, 0.97)
    c.setFont("Helvetica-Bold", 12)
    y = h - 2.55 * inch
    c.drawString(left_x, y, "Domains / table groups (22 tables)")
    c.setFont("Helvetica", 9.5)
    y -= 0.26 * inch
    for domain, tables in TABLE_GROUPS:
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(left_x + 0.15 * inch, y, f"•  {domain}")
        y -= 0.18 * inch
        c.setFont("Helvetica", 8.5)
        c.setFillColorRGB(0.78, 0.82, 0.88)
        # wrap table list
        max_w = w / 2 - 1.9 * inch
        words = tables.split()
        cur = ""
        for word in words:
            trial = f"{cur} {word}".strip()
            if c.stringWidth(trial, "Helvetica", 8.5) <= max_w:
                cur = trial
            else:
                c.drawString(left_x + 0.4 * inch, y, cur)
                y -= 0.15 * inch
                cur = word
        if cur:
            c.drawString(left_x + 0.4 * inch, y, cur)
            y -= 0.2 * inch
        c.setFillColorRGB(0.92, 0.94, 0.97)

    c.setFillColorRGB(0.92, 0.94, 0.97)
    c.setFont("Helvetica-Bold", 12)
    y_r = h - 2.55 * inch
    c.drawString(right_x, y_r, "Document pages")
    c.setFont("Helvetica", 10)
    y_r -= 0.28 * inch
    for i, (_, title) in enumerate(PAGES, start=1):
        c.drawString(right_x + 0.15 * inch, y_r, f"{i}.  {title}")
        y_r -= 0.22 * inch

    y_r -= 0.12 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(right_x, y_r, "Key FK hubs")
    c.setFont("Helvetica", 9)
    y_r -= 0.22 * inch
    hubs = [
        "Users → PortalCredentials, Sessions,",
        "  AcademicHistory, Schedules, ChatSessions",
        "Courses → CourseSections → ScheduleSections",
        "ChatSessions → ChatMessages",
        "KnowledgePages → KnowledgeChunks",
        "Companies → InternshipReviews",
    ]
    for line in hubs:
        c.drawString(right_x + 0.15 * inch, y_r, line)
        y_r -= 0.18 * inch

    y_r -= 0.1 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(right_x, y_r, "Out of relational schema")
    c.setFont("Helvetica", 8.5)
    y_r -= 0.2 * inch
    outs = [
        "Chroma / local vector store (RAG embeddings)",
        "In-memory embedding cache",
        "Resume data (no DB tables)",
        "External MU Portal / university websites",
    ]
    for line in outs:
        c.drawString(right_x + 0.15 * inch, y_r, f"•  {line}")
        y_r -= 0.17 * inch

    # Source note at bottom
    y = 0.95 * inch
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColorRGB(0.65, 0.70, 0.78)
    max_w = w - 3 * inch
    words = SOURCE_NOTE.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if c.stringWidth(trial, "Helvetica-Oblique", 8) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    for line in lines:
        c.drawCentredString(w / 2, y, line)
        y -= 0.14 * inch

    c.setFont("Helvetica", 8)
    c.drawCentredString(
        w / 2,
        0.45 * inch,
        "Relationships shown only where declared as FOREIGN KEY (or noted as soft / no FK).",
    )
    c.save()


def render_mermaid(src: Path, pdf_out: Path) -> None:
    pdf_out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "npx",
        "-y",
        "@mermaid-js/mermaid-cli@11",
        "-i",
        str(src),
        "-o",
        str(pdf_out),
        "-b",
        "white",
        "-s",
        "1.5",
    ]
    print(f"Rendering {src.name} -> {pdf_out.name} ...")
    r = subprocess.run(cmd, cwd=str(ROOT), shell=True)
    if r.returncode != 0:
        raise RuntimeError(f"mermaid-cli failed for {src.name} (exit {r.returncode})")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cover = OUT_DIR / "00-cover.pdf"
    make_cover(cover)

    page_pdfs: list[Path] = [cover]
    for filename, _title in PAGES:
        src = ROOT / filename
        if not src.exists():
            raise FileNotFoundError(src)
        out = OUT_DIR / (src.stem + ".pdf")
        render_mermaid(src, out)
        page_pdfs.append(out)

    writer = PdfWriter()
    for pdf in page_pdfs:
        reader = PdfReader(str(pdf))
        for page in reader.pages:
            writer.add_page(page)

    FINAL_PDF.parent.mkdir(parents=True, exist_ok=True)
    with FINAL_PDF.open("wb") as f:
        writer.write(f)

    print(f"\nWrote {FINAL_PDF} ({FINAL_PDF.stat().st_size} bytes, {len(writer.pages)} pages)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
