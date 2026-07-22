# MuGate UML Diagrams

Complete use case, sequence, and class diagrams derived from the live Capstone-v2 / MuGate codebase.

## Sources

- `MuGate/backend/src/app.ts` route mounts
- `MuGate/backend/src/modules/**` controllers, services, repositories
- `MuGate/supabase/migrations/20260714120000_mugate_schema.sql`
- `MuGate/frontend/src/App.jsx`, `MuGate/mobile/src/navigation/**`

## Interactive canvases (Cursor)

Located under the workspace canvases folder:

- `mugate-uml-overview.canvas.tsx`
- `mugate-use-case.canvas.tsx`
- `mugate-sequence-diagrams.canvas.tsx`
- `mugate-class-diagram.canvas.tsx`

## Mermaid sources (this folder)

| File | Kind | Coverage |
|------|------|----------|
| `01-use-case-browse-auth-academic.mmd` | Use case | Guest / Student / MU Portal |
| `02-use-case-ai-capstone-admin.mmd` | Use case | Student / Admin / System / AI |
| `03-sequence-auth-login.mmd` | Sequence | Portal SSO login |
| `04-sequence-muchat-rag.mmd` | Sequence | MuChat RAG message |
| `05-sequence-schedule-generate.mmd` | Sequence | Schedule generation |
| `06-sequence-history-sync.mmd` | Sequence | Academic history sync |
| `07-sequence-resume-generate-analyze.mmd` | Sequence | Resume generate / analyze / AI-edit |
| `08-sequence-admin-kb-scrape.mmd` | Sequence | Admin university KB crawl |
| `09-class-domain-core.mmd` | Class | Users, academic, schedules, roadmap |
| `10-class-domain-ai-career.mmd` | Class | Chat, RAG, capstone, internships, events |
| `11-class-service-layer.mmd` | Class | Controller → Service dependencies |

## Rendered outputs

- `svg/` — SVG exports
- `pdf/` — PDF exports (when mermaid-cli succeeds)

Regenerate:

```bash
node render-uml.mjs
```
