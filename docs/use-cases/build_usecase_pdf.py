"""
Build MuGate full-project use-case PDF from classic UML PlantUML sources.

Renders each .puml via PlantUML (stick-figure actors + oval use cases),
embeds PNGs into landscape PDF pages (cover + diagram pages), writes:

  MuGate/docs/MuGate-Full-Project-Use-Cases.pdf

Requires: Java, PlantUML jar (auto-downloaded), Graphviz (dot),
          py -3 with pypdf + reportlab.
"""
from __future__ import annotations

import subprocess
import sys
import urllib.request
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "rendered"
FINAL_PDF = Path(__file__).resolve().parents[1] / "MuGate-Full-Project-Use-Cases.pdf"
PLANTUML_JAR = ROOT / "plantuml.jar"
PLANTUML_URL = (
    "https://github.com/plantuml/plantuml/releases/download/"
    "v1.2024.8/plantuml-1.2024.8.jar"
)

PAGES = [
    ("01-overview.puml", "Page 1 — Actors & Domain Packages"),
    ("02-browse-auth.puml", "Page 2 — Public Browse & Auth"),
    ("03-academic.puml", "Page 3 — Academic"),
    ("04-muchat-resume.puml", "Page 4 — MuChat & Resume"),
    ("05-capstone-intern-events.puml", "Page 5 — Capstone, Internships & Events"),
    ("06-admin-system.puml", "Page 6 — Admin Control & Background System"),
]

SOURCE_NOTE = (
    "Classic UML use-case notation (PlantUML): stick-figure actors, oval use cases, "
    "solid associations, dashed «include»/«extend». Derived from live Capstone-v2 / MuGate "
    "code — backend/src/app.ts mounts, modules under backend/src/modules/**, frontend "
    "App.jsx, mobile navigation, and sync.cron."
)


def ensure_plantuml_jar() -> Path:
    if PLANTUML_JAR.exists() and PLANTUML_JAR.stat().st_size > 1_000_000:
        return PLANTUML_JAR
    print(f"Downloading PlantUML jar -> {PLANTUML_JAR.name} ...")
    urllib.request.urlretrieve(PLANTUML_URL, PLANTUML_JAR)
    return PLANTUML_JAR


def make_cover(path: Path) -> None:
    w, h = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=landscape(letter))

    c.setFillColorRGB(0.08, 0.12, 0.18)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColorRGB(0.95, 0.96, 0.98)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 1.1 * inch, "MuGate")

    c.setFont("Helvetica-Bold", 17)
    c.drawCentredString(w / 2, h - 1.55 * inch, "Full-Project Use Case Diagrams")

    c.setFont("Helvetica", 11)
    c.setFillColorRGB(0.75, 0.80, 0.88)
    c.drawCentredString(
        w / 2,
        h - 1.95 * inch,
        "Capstone-v2 / MuGate · Classic UML Use-Case Notation (PlantUML)",
    )

    c.setStrokeColorRGB(0.35, 0.55, 0.85)
    c.setLineWidth(1.5)
    c.line(1.4 * inch, h - 2.2 * inch, w - 1.4 * inch, h - 2.2 * inch)

    c.setFillColorRGB(0.92, 0.94, 0.97)
    c.setFont("Helvetica-Bold", 12)
    y = h - 2.6 * inch
    c.drawString(1.4 * inch, y, "Actors")
    c.setFont("Helvetica", 9.5)
    actors = [
        "Guest — unauthenticated visitor (public reads)",
        "Student — MU-authenticated user (JWT after portal SSO)",
        "Admin — Student with Admins table / super-admin university ID",
        "System (CRON) — node-cron background jobs",
        "MU Portal — external ums.mu.edu.lb (credential verify + scraping)",
        "University Website — mu.edu.lb KB crawl / live search",
        "AI Providers — DeepSeek / Gemini / OpenRouter cascade",
        "External Event Sites — Eventbrite, AUB, Berytech, Zaka, curated",
    ]
    y -= 0.24 * inch
    for line in actors:
        c.drawString(1.55 * inch, y, f"•  {line}")
        y -= 0.2 * inch

    y -= 0.1 * inch
    c.setFont("Helvetica-Bold", 12)
    c.drawString(1.4 * inch, y, "Document pages")
    c.setFont("Helvetica", 9.5)
    y -= 0.24 * inch
    for i, (_, title) in enumerate(PAGES, start=1):
        c.drawString(1.55 * inch, y, f"{i}.  {title}")
        y -= 0.19 * inch

    y -= 0.12 * inch
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColorRGB(0.65, 0.70, 0.78)
    text = SOURCE_NOTE
    max_w = w - 2.8 * inch
    words = text.split()
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
        c.drawString(1.4 * inch, y, line)
        y -= 0.14 * inch

    c.setFont("Helvetica", 8)
    c.drawCentredString(
        w / 2,
        0.5 * inch,
        "Stick-figure actors · Oval use cases · «include» / «extend» only where code has a clear dependency.",
    )
    c.save()


def render_plantuml(src: Path, png_out: Path) -> None:
    png_out.parent.mkdir(parents=True, exist_ok=True)
    jar = ensure_plantuml_jar()
    # PlantUML writes <stem>.png into -o directory
    cmd = [
        "java",
        "-jar",
        str(jar),
        "-tpng",
        "-Sdpi=150",
        "-o",
        str(png_out.parent.resolve()),
        str(src.resolve()),
    ]
    print(f"Rendering {src.name} -> {png_out.name} ...")
    r = subprocess.run(cmd, cwd=str(ROOT))
    if r.returncode != 0:
        raise RuntimeError(f"PlantUML failed for {src.name} (exit {r.returncode})")
    produced = png_out.parent / (src.stem + ".png")
    if not produced.exists():
        # PlantUML names output from @startuml <id> when present
        candidates = sorted(
            png_out.parent.glob("*.png"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not candidates:
            raise FileNotFoundError(f"Expected PlantUML output missing: {produced}")
        produced = candidates[0]
    if produced.resolve() != png_out.resolve():
        if png_out.exists():
            png_out.unlink()
        produced.replace(png_out)


def png_to_pdf_page(png_path: Path, pdf_path: Path, caption: str) -> None:
    """Fit a diagram PNG onto one landscape letter page with a small caption."""
    w, h = landscape(letter)
    c = canvas.Canvas(str(pdf_path), pagesize=landscape(letter))
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    margin_x = 0.35 * inch
    margin_top = 0.3 * inch
    caption_h = 0.35 * inch
    margin_bottom = 0.25 * inch + caption_h

    img = ImageReader(str(png_path))
    iw, ih = img.getSize()
    max_w = w - 2 * margin_x
    max_h = h - margin_top - margin_bottom
    scale = min(max_w / iw, max_h / ih)
    draw_w, draw_h = iw * scale, ih * scale
    x = (w - draw_w) / 2
    y = margin_bottom + (max_h - draw_h) / 2

    c.drawImage(img, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask="auto")

    c.setFillColorRGB(0.25, 0.28, 0.35)
    c.setFont("Helvetica", 8)
    c.drawCentredString(w / 2, 0.18 * inch, caption)
    c.save()


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cover = OUT_DIR / "00-cover.pdf"
    make_cover(cover)

    page_pdfs: list[Path] = [cover]
    for filename, title in PAGES:
        src = ROOT / filename
        if not src.exists():
            raise FileNotFoundError(src)
        png = OUT_DIR / (src.stem + ".png")
        pdf = OUT_DIR / (src.stem + ".pdf")
        render_plantuml(src, png)
        png_to_pdf_page(png, pdf, f"MuGate · {title} · Classic UML (PlantUML)")
        page_pdfs.append(pdf)

    writer = PdfWriter()
    for pdf in page_pdfs:
        reader = PdfReader(str(pdf))
        for page in reader.pages:
            writer.add_page(page)

    FINAL_PDF.parent.mkdir(parents=True, exist_ok=True)
    with FINAL_PDF.open("wb") as f:
        writer.write(f)

    print(
        f"\nWrote {FINAL_PDF} ({FINAL_PDF.stat().st_size} bytes, {len(writer.pages)} pages)"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
