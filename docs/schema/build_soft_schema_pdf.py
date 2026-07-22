"""
Build MuGate soft / application-level relational schema PDF.

Includes declared PostgreSQL FKs (solid) AND soft keys enforced in app code (dashed).
Companion to build_schema_pdf.py (strict FK-only PDF).

Source of truth:
  - supabase/migrations/20260714120000_mugate_schema.sql
  - Application usage in MuGate/backend/src/modules/**

Regenerate:
  py -3 MuGate/docs/schema/build_soft_schema_pdf.py
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
SOFT_DIR = ROOT / "soft"
OUT_DIR = ROOT / "rendered" / "soft"
FINAL_PDF = Path(__file__).resolve().parents[1] / "MuGate-Full-Project-Soft-Relational-Schema.pdf"

PAGES = [
    ("01-overview.mmd", "Page 1 — Full Schema Overview (FK + Soft)"),
    ("02-auth-users.mmd", "Page 2 — Auth / Users (+ Admins soft)"),
    ("03-academic.mmd", "Page 3 — Academic (+ UserRoadmap soft)"),
    ("04-chat.mmd", "Page 4 — MuChat"),
    ("05-knowledge-admin.mmd", "Page 5 — Knowledge / Scraper (+ runId soft)"),
    ("06-capstone-intern-events.mmd", "Page 6 — Capstone, Internships & Events"),
]

SOFT_RELATIONSHIPS = [
    ("CapstonePartners.userId", "Users.id", "JWT userId stored as text; ownership checks in CapstoneRepository"),
    ("InternshipReviews.userId", "Users.id", "JWT userId stored as text; review CRUD scoped by userId"),
    ("UserRoadmap.userId", "Users.id", "JWT userId stored as text; RoadMapRepository filters by userId"),
    ("Admins.universityId", "Users.universityId", "Admin middleware + auth.routes LEFT JOIN on universityId"),
    ("ScrapeQueue.runId", "ScraperRuns.id", "KnowledgeRepository.enqueueUrls tags queue rows with run UUID"),
    ("Events.createdBy", "Users.name", "Manual events store display name (not id); denormalized attribution"),
]

# ASCII arrow for Windows console; PDF cover uses Unicode via reportlab Helvetica.

TRULY_UNRELATED = [
    "ChatAnalytics - aggregate privacy-safe metrics only (no sessionId / userId columns)",
    "CapstoneIdeas - standalone idea catalog (no owner / user columns)",
]

WHY_SOFT = [
    "Legacy SQL Server ensureTables used NVARCHAR userId (text) without FK declarations.",
    "UUID user ids stored as text in feature tables → type mismatch blocks easy PG FKs.",
    "Admins keyed by portal universityId (natural key), not Users.id UUID.",
    "ScrapeQueue.runId left nullable / unconstrained so queue rows survive run cleanup.",
    "Events.createdBy is an audit display string (name), not a resolvable user UUID.",
]

SOURCE_NOTE = (
    "Derived from Capstone-v2 / MuGate PostgreSQL schema "
    "(supabase/migrations/20260714120000_mugate_schema.sql) plus verified soft keys "
    "from backend repositories/services/routes. Strict FK-only companion: "
    "MuGate-Full-Project-Relational-Schema.pdf"
)


def _wrap(c: canvas.Canvas, text: str, font: str, size: float, max_w: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def make_cover(path: Path) -> None:
    w, h = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=landscape(letter))

    c.setFillColorRGB(0.07, 0.14, 0.12)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColorRGB(0.95, 0.98, 0.96)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(w / 2, h - 0.85 * inch, "MuGate")

    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(
        w / 2,
        h - 1.22 * inch,
        "Full-Project Soft / Application Relational Schema",
    )

    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.72, 0.86, 0.80)
    c.drawCentredString(
        w / 2,
        h - 1.52 * inch,
        "Capstone-v2 · Declared FKs + application soft keys · PostgreSQL (Supabase)",
    )

    c.setStrokeColorRGB(0.35, 0.75, 0.55)
    c.setLineWidth(1.5)
    c.line(1.4 * inch, h - 1.72 * inch, w - 1.4 * inch, h - 1.72 * inch)

    # Legend box
    legend_y = h - 2.05 * inch
    c.setFillColorRGB(0.92, 0.97, 0.94)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(1.5 * inch, legend_y, "Legend")
    c.setFont("Helvetica", 9)
    legend_y -= 0.2 * inch
    c.setStrokeColorRGB(0.2, 0.2, 0.2)
    c.setLineWidth(1.2)
    c.line(1.5 * inch, legend_y + 3, 1.5 * inch + 28, legend_y + 3)
    c.setFillColorRGB(0.88, 0.95, 0.90)
    c.drawString(1.5 * inch + 36, legend_y, "Solid line  = declared PostgreSQL FOREIGN KEY")
    legend_y -= 0.18 * inch
    c.setDash(3, 2)
    c.setStrokeColorRGB(0.15, 0.55, 0.40)
    c.line(1.5 * inch, legend_y + 3, 1.5 * inch + 28, legend_y + 3)
    c.setDash()
    c.setFillColorRGB(0.88, 0.95, 0.90)
    c.drawString(
        1.5 * inch + 36,
        legend_y,
        "Dashed line (soft)  = application / soft key — column exists, NO DB FK",
    )

    left_x = 1.5 * inch
    right_x = w / 2 + 0.15 * inch

    # Soft relationships column
    y = h - 2.65 * inch
    c.setFillColorRGB(0.92, 0.97, 0.94)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(left_x, y, f"Soft relationships included ({len(SOFT_RELATIONSHIPS)})")
    y -= 0.22 * inch
    for src, dst, note in SOFT_RELATIONSHIPS:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColorRGB(0.85, 0.95, 0.88)
        line = f"•  {src}  ->  {dst}"
        c.drawString(left_x + 0.1 * inch, y, line)
        y -= 0.14 * inch
        c.setFont("Helvetica", 7)
        c.setFillColorRGB(0.70, 0.82, 0.76)
        for wl in _wrap(c, note, "Helvetica", 7, w / 2 - 1.9 * inch):
            c.drawString(left_x + 0.35 * inch, y, wl)
            y -= 0.12 * inch
        y -= 0.04 * inch

    # Right column: pages + unrelated + why
    y_r = h - 2.65 * inch
    c.setFillColorRGB(0.92, 0.97, 0.94)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(right_x, y_r, "Document pages")
    c.setFont("Helvetica", 8.5)
    y_r -= 0.2 * inch
    for i, (_, title) in enumerate(PAGES, start=1):
        c.drawString(right_x + 0.1 * inch, y_r, f"{i}.  {title}")
        y_r -= 0.16 * inch

    y_r -= 0.08 * inch
    c.setFont("Helvetica-Bold", 10)
    c.setFillColorRGB(0.95, 0.88, 0.75)
    c.drawString(right_x, y_r, "Truly unrelated after soft links")
    y_r -= 0.18 * inch
    c.setFont("Helvetica", 7.5)
    c.setFillColorRGB(0.85, 0.80, 0.70)
    for item in TRULY_UNRELATED:
        for wl in _wrap(c, f"•  {item}", "Helvetica", 7.5, w / 2 - 1.8 * inch):
            c.drawString(right_x + 0.1 * inch, y_r, wl)
            y_r -= 0.13 * inch
        y_r -= 0.02 * inch

    y_r -= 0.06 * inch
    c.setFont("Helvetica-Bold", 10)
    c.setFillColorRGB(0.92, 0.97, 0.94)
    c.drawString(right_x, y_r, "Why soft keys exist")
    y_r -= 0.16 * inch
    c.setFont("Helvetica", 7.5)
    c.setFillColorRGB(0.75, 0.85, 0.80)
    for item in WHY_SOFT:
        for wl in _wrap(c, f"•  {item}", "Helvetica", 7.5, w / 2 - 1.8 * inch):
            c.drawString(right_x + 0.1 * inch, y_r, wl)
            y_r -= 0.12 * inch

    # Footer source
    y = 0.72 * inch
    c.setFont("Helvetica-Oblique", 7.5)
    c.setFillColorRGB(0.60, 0.72, 0.68)
    for line in _wrap(c, SOURCE_NOTE, "Helvetica-Oblique", 7.5, w - 3 * inch):
        c.drawCentredString(w / 2, y, line)
        y -= 0.12 * inch

    c.setFont("Helvetica", 7.5)
    c.drawCentredString(
        w / 2,
        0.32 * inch,
        "Not drawn as soft FKs: AcademicHistory.courseCode / UserRoadmap.courseCode -> Courses "
        "(shared natural key text, but no app join). Events.sourceId is external scraper id.",
    )
    c.save()


def make_legend_page(path: Path) -> None:
    """Optional second cover-adjacent page with soft-key detail table — kept lean: skip; cover has it."""
    pass


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
    r = subprocess.run(cmd, cwd=str(SOFT_DIR), shell=True)
    if r.returncode != 0:
        raise RuntimeError(f"mermaid-cli failed for {src.name} (exit {r.returncode})")


def main() -> int:
    if not SOFT_DIR.is_dir():
        raise FileNotFoundError(f"Missing soft Mermaid sources: {SOFT_DIR}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cover = OUT_DIR / "00-cover.pdf"
    make_cover(cover)

    page_pdfs: list[Path] = [cover]
    for filename, _title in PAGES:
        src = SOFT_DIR / filename
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
    print("Soft relationships:")
    for src, dst, _ in SOFT_RELATIONSHIPS:
        print(f"  [soft]  {src} -> {dst}")
    print("Truly unrelated:", "; ".join(t.split(" - ")[0] for t in TRULY_UNRELATED))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
