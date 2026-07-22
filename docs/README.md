# MuGate Use Case Diagrams

**Primary deliverable:** [`MuGate-Full-Project-Use-Cases.pdf`](./MuGate-Full-Project-Use-Cases.pdf)

Multi-page **classic UML** use-case view of the full Capstone-v2 / MuGate system (stick-figure actors, oval use cases, system boundary, «include» / «extend»), derived from live routes and services.

Rendered with **PlantUML** (not Mermaid flowchart style).

## Regenerate

```bash
py -3 MuGate/docs/use-cases/build_usecase_pdf.py
```

Requirements: Java, Graphviz (`dot`), Python 3 with `pypdf` and `reportlab`. The build script downloads `plantuml.jar` into `use-cases/` if missing.

PlantUML sources: `use-cases/*.puml`. Intermediate PNGs/PDFs: `use-cases/rendered/`.

Old Mermaid flowchart sources are archived under `use-cases/archive-mermaid-flowchart/` (not used for the PDF).
