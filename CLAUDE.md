# CLAUDE.md — MuGate Project Guide

Permanent working rules for Claude (and humans) on this repo. Read alongside
`PROJECT_CONTEXT.md` (architecture) and `FINAL_AUDIT_REPORT.md` (current state).

## Golden rules
1. **Understand before changing.** Read the file and its callers; prefer improving existing systems over rewrites. Preserve working functionality.
2. **Minimal, additive, safe.** Especially for the PDF/DOCX generators and AI flows — change carefully, keep backward compatibility.
3. **Never commit secrets.** `backend/.env` is gitignored and untracked — keep it that way. Add new vars to `backend/.env.example` (names + placeholders only).
4. **Don't claim it works unless tested.** Label findings Verified / Likely / Assumed / Not Tested.
5. **Don't expand scope.** Fix the asked thing; don't refactor unrelated files in the same pass.

## Stack & commands
- Frontend: React 19 + Vite, **JavaScript** (no TS in frontend). `npm run dev | build | lint`.
- Backend: Express 5 + **TypeScript**. `npm run dev`; type-check `npx tsc --noEmit`.
- Verify changes with **both builds**; lint baseline is currently dirty (pre-existing errors in RoadMap/Schedule/analyzeResume) — ensure you add **no new** lint errors.

## Conventions
- **Folders:** one folder per feature under `pages/` (frontend) and `modules/` (backend). Co-locate component CSS with the component.
- **Backend modules:** `controllers/`, `services/`, `routes/` (+ `ai/`, `files/` etc. where relevant). Keep controllers thin; logic in services.
- **Naming:** backend files `name.kind.ts` (e.g. `auth.service.ts`, `pdf-generator.service.ts`). React components PascalCase; hooks `useXxx`.
- **Styling:** Tailwind v4 utilities + per-component `.css`. No styled-components/emotion. Reuse existing color tokens (primary `#2b5ea7`).
- **Icons:** prefer `lucide-react` over new inline SVG where practical.

## Security rules
- No new hardcoded credentials, admin IDs, or API keys in code. (The existing `"101230004"` super-admin is legacy; don't copy the pattern, and don't remove it without asking — it may be demo-critical.)
- Validate/sanitize user input that flows into generated documents or SQL.
- Frontend stores auth in `localStorage` (`mugate_token`, `mugate_user`); treat as untrusted on the backend — always re-verify on protected routes.

## Resume / CV system rules
- **Extras contract:** repeatable entries (extra education/experience/projects/leadership) travel in a separate top-level `extras` object in the `/api/resume/generate` body — **never** inside flat `formData`. The generators sanitize `formData` to strings and would blank arrays. Shape:
  - local: `{ edu:[{from,to,inst,loc,gpa}], exp:[{from,to,company,loc,pos,bullet1,bullet2,bullet3}], projects:[{text}] }`
  - global: `{ exp:[{org,loc,title,dates,b1,b2,b3,b4}], lead:[{org,loc,role,dates,b1,b2}] }`
- Keep the **PDF and DOCX generators in sync** — every field change must land in both `pdf-generator.service.ts` and `docx-generator.service.ts`.
- The preview in `ResumeBuilderPage.jsx` is the source of truth for what the document should contain — keep generator output aligned with it.
- Builder state (`localForm`, `globalForm`, extra arrays) is persisted via `usePersistentState` (localStorage keys `mugate_resume_*`). Don't add data-loss paths.
- **Live editor:** the `editor/` folder keeps resume **DATA** (`resumeSchema.js`, normalized) separate from **TEMPLATE** (`templates/LocalTemplate`, `GlobalTemplate`). One data object renders both. Export goes through `adapters.js` `toBackendPayload()` → the existing `/api/resume/generate` (never write a new generator). When you add a schema field, update: the templates, `adapters.js` (both `toLocalPayload`/`toGlobalPayload` AND `fromLocalForm`/`fromGlobalForm`), and the backend `ai-editor.service.ts` normalizer/prompt. Global CV has no summary and no extra-education export (backend limitation) — keep the template/adapter consistent with that.
- AI edit (`/api/resume/ai-edit`) must return the FULL normalized resume; the frontend replaces state with the normalized result. The service returns the input UNCHANGED on any AI failure — preserve that safety.

## Chat sessions
- `ChatSessions` has a **`source`** column: `'chat'` (MuChat) or `'resume'` (Resume Enhancer). The chatbot history (`getSessions`/`getSessionsByIds`) lists ONLY `source='chat'`. Any feature that calls `chatbotApi.createSession(title, source)` for AI memory **must pass its own source** (Resume passes `'resume'`) so it never pollutes MuChat history. New DBs get the column from `init.sql`; existing DBs via the idempotent ALTER in `core/database/connection.ts`.

## AI system rules
- Use the provider cascade in `ai.provider.ts`; don't call a provider SDK directly elsewhere.
- Always provide a graceful fallback (the chat flows fall back to canned tips; keep that behavior).
- Prefer the latest Claude models if/when adding Anthropic calls (`claude-opus-4-8`, etc.).

## Common mistakes to avoid
- Putting `extras` arrays inside `formData` (they get silently dropped).
- Editing only one of the two document generators.
- Adding `catch {}` empty blocks (lint `no-empty`); add a short comment or handle the error.
- Assuming a separate login page exists — auth UI lives inside `Home.jsx`.
- Hardcoding new backend URLs. Use `API_BASE_URL` from `utils/api.js` (and the `resumeApi.js` helpers for resume file calls); all `localhost:5000` fetches were centralized there in Session 5.

## Testing standard
No test suite yet. Required before declaring done: backend `tsc --noEmit` clean, frontend
`npm run build` clean, no new lint errors, and a manual run of the affected flow.
