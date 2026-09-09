# SUBMISSION_PACKAGE.md — MuGate

University final-project submission documentation.

## 1. Project overview
**MuGate** is an all-in-one student companion platform for **Al Maaref University**. It
combines an AI academic assistant, career tooling (resume/CV), and university services
(schedules, internships, capstone matching, events, degree roadmap) behind a single
authenticated portal that logs students in using their existing MU Portal credentials.

## 2. Features
- **MuChat** — RAG-based AI assistant that answers personal-academic and university
  questions, with content moderation and multi-provider fallback.
- **Resume Enhancer** — upload a resume, get a score across ~12 criteria, interactive
  suggestions, and AI-assisted edits.
- **CV Builder** — guided builder for **Local (Lebanese)** and **Global (international/
  Harvard)** formats with live preview and PDF/DOCX export, including unlimited extra
  education/experience/project/leadership entries.
- **Schedule Generator** — builds and optimizes course schedules from catalog data.
- **Capstone** — project-idea database, AI advisor, and partner matching.
- **Internships** — curated listings with a 3D showcase.
- **Events** — auto-scraped Lebanese tech events + admin-managed manual events.
- **Roadmap** — interactive degree roadmap.
- **Admin Control** — grant/revoke admin, monitor active admins, trigger event scraping, manage events.

## 3. Technologies
- **Frontend:** React 19, Vite 7, React Router 7, Tailwind CSS v4, Three.js / @react-three, lucide-react, mammoth, pdfjs-dist.
- **Backend:** Node.js, Express 5, TypeScript, SQL Server (`mssql`), JWT + bcrypt, Playwright, node-cron, pdfkit, docx, pdf-parse.
- **AI:** DeepSeek, Google Gemini, OpenRouter (provider cascade with retry/fallback).

## 4. System architecture
SPA frontend (Vite) ⇄ REST API (Express) ⇄ SQL Server. Auth verifies credentials by
scraping the MU Portal (Playwright) and issues JWTs. Background `node-cron` jobs scrape
university/event data into the database. The chatbot runs a RAG pipeline over a knowledge
base and falls back across AI providers. See `PROJECT_CONTEXT.md` for the folder map and
workflow detail.

```
[React SPA] --HTTP--> [Express API] --mssql--> [SQL Server]
                          |  \-- Playwright scrapers (portal, events)
                          |  \-- AI cascade (DeepSeek/Gemini/OpenRouter)
                          \-- pdfkit / docx (document generation)
```

## 5. Installation
**Prerequisites:** Node.js 18+, a running SQL Server instance, npm.
1. **Backend**
   - `cd backend && npm install`
   - `cp .env.example .env` and fill in `DB_*`, `JWT_SECRET`, `ENCRYPTION_SECRET`, and at least one AI provider key.
   - `npx playwright install` (first run, for scrapers).
   - `npm run dev` → API on `http://localhost:5000` (tables auto-create on startup).
2. **Frontend**
   - `cd frontend && npm install`
   - `npm run dev` → open the printed Vite URL.

## 6. Usage / demo flow
1. Open the app → land on Home.
2. Log in with MU Portal credentials (User ID + password) in the hero login form.
3. **MuChat:** ask an academic question; show a personal vs. university answer.
4. **Resume Enhancer:** upload a resume → show score + suggestions → apply an AI edit.
5. **CV Builder:** pick **Local CV** (note the Lebanon flag badge) → fill fields, add 2+
   extra education/experience entries → Review → download **PDF** and **DOCX** and show
   all entries are present. Repeat briefly for **Global CV**.
6. **Persistence:** refresh mid-build to show data is retained.
7. **Admin (if logged in as admin):** open **Control** → grant/revoke admin, trigger an
   event scrape.

## 7. Screenshots to capture (for the report)
- Home + nav (logged out and logged in, showing Control + Logout spacing).
- MuChat conversation.
- Resume Enhancer score + suggestions.
- CV Builder Local form with **Lebanon flag** badge + live preview.
- A generated PDF and DOCX showing extra entries.
- Admin Control panel.
- Events page (scraped + manual).

## 8. Known limitations
- Auth depends on the live MU Portal being reachable (Playwright scrape).
- Resume "AI edit document" feature is brittle (regex-based; can lose formatting).
- No automated test suite; verification is build + manual.
- Main navigation is desktop-first (`min-width:1200px`); limited mobile layout.
- Frontend bundle is large (single ~2.2 MB JS chunk; heavy image/video assets).

## 9. Future enhancements
- Rotate secrets and move to per-environment secret management.
- WYSIWYG inline resume editor + multiple CV templates.
- Backend deep AI resume analyzer (explainable ATS scoring) and job-description matching.
- Mobile-responsive navigation and route-level code splitting.
- Automated tests (unit + integration) and CI.
