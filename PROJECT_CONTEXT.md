# PROJECT_CONTEXT.md — MuGate

> Fast-load context for future Claude sessions. Read this first; it summarizes the
> whole project so you can act without re-scanning the repo.

## What MuGate is
A student platform for **Al Maaref University (MU)**. Frontend portal + AI features:
MuChat (RAG assistant), Resume Enhancer & CV Builder, Schedule generator, Capstone
matching, Internships, Events (auto-scraped), Roadmap, and an Admin Control panel.

## Stack
- **Frontend:** React 19 + Vite 7, React Router 7, Tailwind v4 **+ per-component CSS**, JavaScript (no TS). Three.js/@react-three for 3D, lucide-react icons, mammoth/pdfjs for file parsing.
- **Backend:** Express 5 + **TypeScript**, SQL Server (`mssql`), JWT + bcrypt, Playwright (portal + events scraping), node-cron, pdfkit/docx for document generation.
- **AI:** multi-provider cascade DeepSeek → Gemini → OpenRouter with retry/fallback.

## Run / build
- Backend: `cd backend && npm install && npm run dev` (serves on **:5000**). Type-check: `npx tsc --noEmit`.
- Frontend: `cd frontend && npm install && npm run dev` (Vite). Build: `npm run build`. Lint: `npm run lint`.
- Env: copy `backend/.env.example` → `backend/.env` and fill values. Requires a reachable SQL Server (`DB_*`). Frontend calls the backend via `API_BASE_URL` in `frontend/src/utils/api.js` (defaults to `http://localhost:5000`).

## Folder map (high-signal)
```
frontend/src/
  pages/            one folder per feature (Home, Chatbot, ResumeEnhancer, Schedule,
                    Capstone, Internship, Events, RoadMap, AdminControl, About; Auth/ is empty)
  components/       layout/ (GlobalGlow), ui/, chatbot/, effects/
  services/         per-feature HTTP clients (chatbotApi, adminApi, eventsApi, ...)
  utils/api.js      central apiFetch() wrapper (adds auth token)
backend/src/
  app.ts main.ts    Express setup + startup (port 5000)
  core/             database/ (connection + migrations/*.sql), middleware/ (auth, admin,
                    optionalAuth, error, rateLimiter), security/ (jwt.util, encryption.util), logger/
  config/           env.ts, database.config.ts, encryption.config.ts
  modules/          auth, academic/{courses,schedules}, ai/chatbot, resume, scheduling,
                    capstone, internships, events, roadmap, system/{scraper,sync}, history, admin, users
```

## Key files
| Concern | File |
|---|---|
| Frontend routes | `frontend/src/App.jsx` |
| Main nav + embedded login/logout | `frontend/src/pages/Home/Home.jsx` (+ `Home.css`) |
| Resume/CV root (state, download) | `frontend/src/pages/ResumeEnhancer/index.jsx` |
| CV builder form + preview | `frontend/src/pages/ResumeEnhancer/pages/ResumeBuilderPage.jsx` |
| Resume analyzer | `frontend/src/pages/ResumeEnhancer/pages/ResumeAnalyzerPage.jsx` + `utils/analyzeResume.js` |
| Persistence hook | `frontend/src/pages/ResumeEnhancer/hooks/usePersistentState.js` |
| Resume backend | `backend/src/modules/resume/{controllers,services}` (pdf-generator, docx-generator, editor.service, **analyzer.service**) |
| Resume AI analysis | `POST /api/resume/analyze` → `analyzer.service.ts`; frontend `services/resumeApi.js` + `components/AnalysisBreakdown.jsx` |
| Live resume editor | `pages/ResumeEnhancer/editor/` (schema/adapters/templates/ResumeEditor) + `POST /api/resume/ai-edit` → `ai-editor.service.ts` |
| Auth (portal scrape + JWT) | `backend/src/modules/auth/auth.service.ts`, `core/middleware/auth.middleware.ts` |
| Admin gate | `backend/src/core/middleware/admin.middleware.ts` |
| AI providers | `backend/src/modules/ai/chatbot/ai/ai.provider.ts` |
| DB schema | `backend/src/core/database/migrations/init.sql`, `rag-tables.sql` |

## Critical workflows
- **Auth:** user submits university ID + password (login is embedded in `Home.jsx`, no separate Auth page) → backend verifies against the **MU Portal via Playwright** (`system/scraper/portal.scraper.ts`), auto-registers on first login, stores encrypted portal creds, issues a **24h JWT**. Frontend stores `mugate_token` + `mugate_user` in localStorage.
- **Authorization:** JWT middleware on protected routes. **Admin** = `Admins` table entry **or** hardcoded `universityId === "101230004"` (super-admin, also gated in the nav).
- **Chatbot (RAG):** classify question (PERSONAL / UNIVERSITY / OFF_TOPIC) → moderate → retrieve knowledge (university questions) → enhance with student context → generate via provider cascade → fallback mock if all fail. **Sessions carry a `source` column (`'chat'` | `'resume'`); the chatbot history lists only `source='chat'`** so Resume Enhancer AI chats never appear in MuChat.
- **CV Builder:** `index.jsx` holds `localForm`/`globalForm` plus repeatable "extra" arrays (`localExtraEdu/Exp/Projects`, `globalExtraExp/Lead`). `handleDownload` POSTs `{format, formData, extras, fileType}` to `/api/resume/generate`; backend renders PDF (pdfkit) or DOCX (docx). **Extras MUST travel as a separate `extras` field** — the generators' string sanitizer blanks non-string values, so arrays placed inside `formData` would be silently dropped.
- **Live Editor (Jobsuit-style):** `editor/` holds a **normalized, template-agnostic data model** (`resumeSchema.js`) rendered by `templates/LocalTemplate` or `GlobalTemplate` (same data, two templates). `ResumeEditor.jsx` supports inline manual editing (instant live preview) + AI section/full rewrite (`/api/resume/ai-edit` → structured JSON, merged safely). Export reuses the existing `/api/resume/generate` via `adapters.js` (`toBackendPayload`) so PDF/DOCX **content** always matches the preview. Reached via the "Open Live Editor" button in the builder; editor data persists under `mugate_resume_editorData`. The legacy form builder + analyzer are unchanged.
- **Resume Analyzer:** upload PDF/DOCX → instant local heuristic score + suggestions → then **explainable AI analysis** via `POST /api/resume/analyze` (overall + 5 category scores with reasoning/strengths/weaknesses/improvements, matched/missing keywords vs an optional job description). Always reliable: the analyzer falls back to a deterministic heuristic if the AI is unavailable. Interactive "change \"old\" to \"new\"" edits still applied by `editor.service.ts` (brittle; see audit).
- **Events:** Playwright + HTTP scraper aggregates tech events; admins can trigger scrape and CRUD manual events.

## Database (SQL Server `MuGate`, auto-created on startup)
Users, PortalCredentials (encrypted), Courses, CourseSections, AcademicHistory, Schedules,
ScheduleSections, Sessions, ChatSessions, ChatMessages, ChatAnalytics, Admins, + RAG tables.

## Constraints / decisions
- JS frontend / TS backend — keep it that way.
- Styling = Tailwind v4 + per-component CSS files; no CSS-in-JS library.
- No automated tests exist; verification is build + manual.
- Frontend→backend base URL is centralized in `API_BASE_URL` (`frontend/src/utils/api.js`); all fetches route through it (Session 5). Default is `http://localhost:5000`; resume file calls use the `resumeApi.js` helpers.

## Roadmap / deferred (see FINAL_AUDIT_REPORT.md)
Rotate leaked secrets + scrub git history (#1); Resume AI editor rewrite; Resume state
refactor (Context/reducer); mobile nav (`.hero-nav-notched` has `min-width:1200px`);
bundle-size code-splitting; remove hardcoded admin id.
**Done in Session 2:** backend explainable AI analyzer (`/api/resume/analyze`).
**Done in Session 3:** Jobsuit-style live editor — normalized data/template split, inline
manual editing, AI structured rewrite (`/api/resume/ai-edit`), export via existing generator.
**Done in Session 4:** chat `source` separation (resume vs MuChat), correct Lebanon flag in
CVTypeModal, editor preview/edit render fixes, route code-splitting (`App.jsx` lazy), junk
files removed. Routes are now lazy — keep new pages default-exported.
