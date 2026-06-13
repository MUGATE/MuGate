# FINAL_AUDIT_REPORT.md — MuGate

Audit + Session-1 changes. Findings labeled **[Verified]** (read source / ran it),
**[Likely]**, **[Assumed]**, **[Not Tested]**.

This session was deliberately scoped to **safe quick wins + documentation**. Large
refactors and the security history-rewrite were explicitly deferred (see §5).

---

## 1. Issues discovered

### Critical
- **[Verified] Secrets committed to git.** `backend/.env` was tracked (`git ls-files`
  listed it) despite being in `.gitignore`. It contains live DeepSeek/Gemini/OpenRouter
  API keys, `JWT_SECRET`, `ENCRYPTION_SECRET`, and DB credentials. They remain in git
  history. → Partially addressed (§2); **rotation + history scrub still required (§5)**.
- **[Verified] Resume data-loss.** Dynamically added education/experience/project/
  leadership entries were collected in the UI but **never sent** to `/api/resume/generate`
  (`handleDownload` posted only flat `localForm`/`globalForm`), so generated PDF/DOCX
  silently dropped them. → **Fixed (§2).**
- **[Verified] No builder persistence.** All CV builder state was in-memory; a page
  refresh wiped the user's work. → **Fixed (§2).**

### High
- **[Verified] Hardcoded admin backdoor.** `universityId === "101230004"` grants admin in
  `admin.middleware.ts` and the frontend nav. → Documented, **not changed** (may be
  demo-critical; removing it needs your sign-off).
- **[Verified] Brittle AI document editor.** `editor.service.ts` does regex find/replace on
  extracted text then rebuilds the whole PDF via Playwright — loses formatting, fragile on
  special characters. → Deferred (§5).
- **[Verified] Desktop-only navigation.** `.hero-nav-notched` has `min-width:1200px` with
  no mobile breakpoint → horizontal scroll on smaller screens. → Deferred (§5).

### Medium
- **[Verified] Lint baseline is dirty.** Originally `npm run lint` reported 56 pre-existing
  errors (RoadMap, Schedule, `analyzeResume.js`, several `no-empty`/`no-unused-vars`). →
  **Largely cleared in Session 5 (§5d): down to 8 errors / 2 warnings**, all in the
  react-compiler / react-three-fiber category left intentionally untouched (behavior risk).
- **[Verified] Large frontend bundle.** Production build emits a single ~2.2 MB JS chunk
  (gzip ~611 kB) plus very large image/video assets (multi-MB PNGs, a ~40 MB mp4). No code
  splitting. → Deferred (§5).
- **[Verified] Hardcoded API base URL.** Resume download called `http://localhost:5000`
  directly instead of the central `utils/api.js` wrapper. → **Fixed in Session 5 (§5d):**
  all 10 hardcoded fetches now route through `API_BASE_URL`.
- **[Verified] Toy resume analyzer.** `analyzeResume.js` uses naive regex checks; can't
  assess content quality, ATS, or keyword density. → Deferred (§5).

---

## 2. Fixes applied this session

1. **Resume extras now reach the backend [Verified].**
   - Frontend `handleDownload` ([index.jsx]) sends a new top-level `extras` object
     (`{edu,exp,projects}` for local; `{exp,lead}` for global) and depends on those arrays.
   - Controller ([resume.controller.ts]) reads `extras` (optional, backward-compatible) and
     forwards it to both generators.
   - **PDF** ([pdf-generator.service.ts]) and **DOCX** ([docx-generator.service.ts]) now
     render extra education/experience/project entries (local) and extra experience/
     leadership entries (global), appended after the fixed slots, reusing existing helpers.
     A shared `ResumeExtras` type + `ex()` safe-reader keep `formData` string-sanitization
     intact (arrays travel separately so they are not blanked).
2. **Builder persistence [Verified].** New `hooks/usePersistentState.js` mirrors state to
   `localStorage` (keys `mugate_resume_*`); applied to `localForm`, `globalForm`, and all
   five extra arrays. Falls back to in-memory on storage errors.
3. **Lebanon flag [Verified].** Replaced the plain "Lebanon" text badge with an inline SVG
   flag (red–white–red bands + green cedar) + label, vertically aligned via updated
   `.re-cv-badge` / new `.re-flag-lb` CSS. Global "International" badge unchanged.
4. **Logout spacing [Verified].** Added `margin-right` to `.nav-group-center` and a small
   `margin-left` to the logout button wrapper so **Control** and **Logout** no longer crowd.
5. **Secret hygiene [Verified].** `git rm --cached backend/.env` (file kept on disk, now
   untracked) and added `backend/.env.example` (variable names + placeholders, **no secrets**).
6. **Lint hygiene in touched files [Verified].** Annotated the two pre-existing empty
   `catch {}` blocks in `Home.jsx` and `ResumeEnhancer/index.jsx` so those files are lint-clean.
7. **Documentation [Verified].** Added `PROJECT_CONTEXT.md`, `CLAUDE.md`,
   `SUBMISSION_PACKAGE.md`, and this report.

## 3. Files changed
```
backend/.env                                              (untracked: git rm --cached)
backend/.env.example                                      (new)
backend/src/modules/resume/controllers/resume.controller.ts
backend/src/modules/resume/services/pdf-generator.service.ts
backend/src/modules/resume/services/docx-generator.service.ts
frontend/src/pages/ResumeEnhancer/index.jsx
frontend/src/pages/ResumeEnhancer/pages/ResumeBuilderPage.jsx
frontend/src/pages/ResumeEnhancer/styles/builder.css
frontend/src/pages/ResumeEnhancer/hooks/usePersistentState.js   (new)
frontend/src/pages/Home/Home.jsx
frontend/src/pages/Home/Home.css
PROJECT_CONTEXT.md  CLAUDE.md  SUBMISSION_PACKAGE.md  FINAL_AUDIT_REPORT.md  (new docs)
```

## 4. Verification performed
- **[Verified]** Backend type-check: `npx tsc --noEmit` → exit 0.
- **[Verified]** Frontend production build: `npm run build` → exit 0 (built in ~25s).
- **[Verified]** Lint: no new errors introduced; touched files lint-clean. Pre-existing
  56-error baseline unchanged.
- **[Not Tested]** End-to-end runtime of the resume download with extra entries, the
  localStorage refresh behavior, and the visual rendering of the flag/logout spacing — these
  require running both servers + a browser and a live SQL Server, which was not done here.
  Recommended manual checks are listed in `SUBMISSION_PACKAGE.md` §6 and the plan file.

## 5. Remaining recommendations (ranked)
1. **Rotate ALL leaked secrets** (DeepSeek, Gemini, OpenRouter keys; `JWT_SECRET`;
   `ENCRYPTION_SECRET`; DB password) and **scrub git history** (`git filter-repo` / BFG).
   The keys in this repo's history must be treated as compromised. *(Destructive — owner action.)*
2. Decide on the **hardcoded admin id** (`"101230004"`) — replace with DB-driven roles or
   keep intentionally for the demo, documented.
3. **Resume AI editor rewrite** — the *legacy upload-and-edit* path (`editor.service.ts`,
   regex+rebuild) is still brittle. **Note:** Session 3 added a separate, robust
   **structured** editor (`ai-editor.service.ts` + `/api/resume/ai-edit`) used by the new live
   editor; the legacy text-edit path remains for the analyzer's uploaded-file flow.
   *(Next: route the analyzer's edits through the structured editor too.)*
4. ~~**Backend AI analyzer**~~ — **DONE (Session 2):** `POST /api/resume/analyze`
   (`analyzer.service.ts`) returns explainable overall + 5 category scores (ATS, content,
   impact, structure, keyword match) with reasoning/strengths/weaknesses/improvements and
   job-description keyword matching; deterministic heuristic fallback. Frontend shows it via
   `AnalysisBreakdown.jsx`. *(Next: optionally have the AI editor consume these findings.)*
5. **Resume state refactor** — Context + reducer to tame `index.jsx`.
6. **Mobile navigation** — responsive breakpoints for `.hero-nav-notched`.
7. **Performance** — route-level code splitting + asset compression (the multi-MB images
   and ~40 MB landing video dominate the bundle).
8. ~~**Clear the lint baseline**~~ — **mostly DONE (Session 5, §5d):** 56 → 8 errors;
   remaining 8 are intentional react-compiler / react-three-fiber items. Still worth adding CI.
9. ~~**Centralize the API base URL**~~ — **DONE (Session 5, §5d):** all 10 hardcoded
   `localhost:5000` fetches now use `API_BASE_URL` from `utils/api.js`.

## 5b. Session 3 — Jobsuit-style live resume editor (additive)
- **New backend** `ai-editor.service.ts` + `POST /api/resume/ai-edit`: AI rewrites a section
  or the full CV and returns **structured normalized JSON**; on any AI failure it returns the
  resume **unchanged** (never corrupts state). Reuses the `AiProvider` cascade. Existing
  generate/edit/analyze endpoints untouched.
- **New frontend `editor/`** module: a normalized **data model** (`resumeSchema.js`) separated
  from **template** renderers (`templates/LocalTemplate`, `GlobalTemplate`, shared `parts.jsx`)
  — the SAME data renders either CV. `ResumeEditor.jsx` adds **inline manual editing** with an
  instant live preview, an **AI panel** (target a section or whole CV), and a **template
  switcher**. `adapters.js` converts data ⇄ the existing backend payload, so **export content
  always matches the preview**; PDF/DOCX go through the unchanged `/api/resume/generate`.
- **Entry point:** "Open Live Editor" button in the existing builder; editor data persists
  (`mugate_resume_editorData`). The legacy form builder, analyzer, scoring, and all backend
  generators are **unchanged** — fully backward compatible.
- **[Verified]** backend `tsc` exit 0; frontend `npm run build` exit 0; no new lint errors;
  service smoke test (no-keys → safe unchanged structured output; malformed input coerced safely).
- **[Not Tested]** Live AI rewrite + visual editing in a browser (needs running servers + keys).
- **Known caveat:** export matches the preview in **content**, not pixel-for-pixel layout —
  the backend pdfkit/docx generators keep their own layout (kept intact by design). Global CV
  has no objective/summary and limited extra-education in export (backend limitation).

## 5c. Session 4 — bug fixes, cleanup, performance, polish
- **[Verified] Resume chats no longer pollute MuChat history (real bug).** Added a `source`
  column to `ChatSessions` (`'chat'` | `'resume'`). MuChat listing filters to `source='chat'`;
  Resume Enhancer sessions are created with `source='resume'` and are excluded from the chat
  history and from the per-source session cap. Fresh DBs get the column from `init.sql`;
  existing DBs via an idempotent `ALTER` in `connection.ts`. Frontend `createSession(title,
  source)` also skips anonymous-recovery storage for non-chat sessions. *(Files: init.sql,
  connection.ts, chatbot.memory.service.ts, chatbot.service.ts, chatbot.controller.ts,
  create-session.dto.ts, chatbotApi.js, ResumeEnhancer/index.jsx, ResumeAnalyzerPage.jsx.)*
- **[Verified] Lebanon flag corrected.** The "Choose CV Format" picker (`CVTypeModal`) showed
  an incorrect hand-drawn flag (red/green bands). Replaced with a correct, reusable
  `LebanonFlag` component (red–white–red + green cedar), now shared by the picker and the
  builder badge.
- **[Verified] Live-editor correctness fixes.** (a) In **edit mode** the prefixed read-only
  lines (Minor/GPA/Coursework/Grad date) no longer render duplicated alongside their inputs.
  (b) In **preview mode** empty sections/entries are hidden instead of showing bare headers.
- **[Verified] Repo cleanup.** Deleted dead/legacy/junk: empty `ResumeEnhancer.jsx`,
  `check_users.js` (a debug script that **hardcoded the DB password** — also a security
  liability), `generate_polygon.html`, `scrape_log.txt`, and the obsolete
  `RESUME_ENHANCER_FIXING_PLAN.md`. Added `*.log` / cache ignores to `.gitignore`.
- **[Verified] Performance (Phase 5).** Route-level code splitting (`React.lazy` + `Suspense`)
  in `App.jsx`. The single ~2.2 MB JS bundle is now **24 chunks**; the heavy 3D Internships
  page (~988 KB) and other routes load on demand, so the landing page is far lighter.
- **[Verified]** backend `tsc` exit 0; frontend `npm run build` exit 0 (24 JS chunks); no new
  lint errors. **[Not Tested]** the `source` migration + chat separation at runtime (needs a
  running SQL Server + browser).

## 5d. Session 5 — codebase cleanup & lint pass (additive, non-behavioral)
Scope was deliberately limited to **deleting dead files, centralizing one constant, and
mechanical lint fixes** — no feature or behavior changes. Every deletion was verified
unreferenced (grep across the tree) before removal.

- **[Verified] Dead/junk files removed.** Each confirmed to have no importers first:
  - Empty/unused styles & stubs: `frontend/src/services/api.js` (empty), `App.css`,
    `styles/globals.css`, `styles/effects.css`.
  - `frontend/src/data/internships.js` — only referenced by an already-deleted `_original`
    file and carried `no-undef` bugs.
  - Leftover originals/scratch: `Capstone/IdeasDatabase_original.jsx`,
    `Internship/InternshipList_original.jsx`, `Capstone/CSC_499_Projects_All_Semesters.txt`.
  - Unused Internship 3D components (not imported by the live `InternshipList`): `Logo.jsx`,
    `GlassFloor.jsx`, `VolumetricBeam.jsx`, `Carousel.jsx`, `LogoCarousel.jsx`, `Logo3D.jsx`,
    `Navbar.jsx`.
  - Empty backend dirs: `src/database/` (`models/`, `seeders/` `.gitkeep` stubs),
    `src/modules/ai/ok/`.
- **[Verified] Centralized the API base URL.** Added `API_BASE_URL` to `frontend/src/utils/api.js`
  and resume helpers (`generateResumeFile`, `editResumeFile`) to `frontend/src/services/resumeApi.js`;
  replaced **all 10** hardcoded `http://localhost:5000` fetches (Home login, RoadMap ×3,
  ResumeEnhancer ×2, ResumeEditor, ResumeAnalyzer edit, and the resumeApi helper). This closes
  recommendation **#9** and the "hardcoded API base URL" Medium finding for the frontend.
- **[Verified] Lint baseline reduced 56 → 8 errors.** Cleared ~45 mechanical errors tree-wide:
  annotated empty `catch {}` blocks, removed unused imports/vars and dead destructures, dropped
  dead `changeInstructor`/`studentInfo`, and fixed the `analyzeResume.js` regex-escape +
  unused-param errors. Also removed a now-dangling `// eslint-disable-next-line` in
  `ScoreRing.jsx`. **No new errors introduced.**
- **Remaining lint floor (8 errors, 2 warnings) — deliberately NOT touched** (behavior risk,
  not bugs):
  - `react-hooks/set-state-in-effect` (5): `About.jsx`, `AddEditModal.jsx`, `EventModal.jsx`,
    `BottomNavbar.jsx`, `PdfViewer.jsx` — react-compiler guidance; rewriting these effects risks
    changing working behavior.
  - `react-hooks/immutability` (3): `BackgroundHalo.jsx`, `GodRayFountain.jsx`, `LogoPlane.jsx` —
    false positives from applying the rule to react-three-fiber's `useFrame` mutation pattern
    (standard r3f animation code). Plus 2 `exhaustive-deps` warnings in the same r3f files.
- **[Verified] Folder structure aligned to the `components/` convention.** Flat feature folders
  were grouped to match the rest of the tree (which already used `components/`):
  - **Home/** — moved the 9 showcase `.jsx`+`.css` pairs (AboutSummary, BottomNavbar,
    Capstone/Chatbot/Events/Internship/RoadMap-Showcase, DoctorCarousel, ResumeAnalyzer) into
    `Home/components/`. `Home.jsx`, `index.jsx`, `doctorData.js`, and `assets/` stay at root.
  - **RoadMap/** — moved `CourseBox.jsx` + `CourseModal.jsx` into `RoadMap/components/`.
  - **Chatbot/** — moved the loose `FluidTrail.jsx` into the existing `Chatbot/components/`.
  - Removed the empty `pages/Auth/` directory (auth UI lives in `Home.jsx`).
  - All importer paths updated (Home.jsx ×9, RoadMap.jsx ×2, Chatbot.jsx + ChatSidebar.jsx,
    plus the moved files' own asset/data/service imports). `About/`, `AdminControl/` left flat
    (single-component folders — a subfolder adds nothing).
- **[Verified]** backend `tsc --noEmit` exit 0; frontend `npm run build` exit 0; frontend lint at
  the 8-error/2-warning floor above (no new issues). **[Not Tested]** runtime of the affected
  flows (resume download, RoadMap, Home login) — unchanged endpoints, but not exercised live here.

## Phase completion matrix (as of Session 5)
| Phase | State | Notes |
|---|---|---|
| 1 Discovery / 2 Plan | ✅ | docs + plan |
| 3 Professional refactor | 🟢 mostly | editor modularized; junk removed; Session 5 deleted remaining dead files + centralized API URL; broad reorg intentionally avoided (risk) |
| 4 Bug hunt | 🟢 | resume data-loss, persistence, chat-pollution, editor render bugs fixed |
| 5 Performance | ✅ | route code-splitting |
| 6 Resume Enhancer | ✅ | analyzer + explainable scoring + AI rewrite + live editor |
| 7 CV Generator | ✅ | local/global, extras, correct flag, export parity |
| 8 UI/UX | 🟢 mostly | logout spacing, flag, editor polish; full mobile pass still open |
| 9 Database | 🔵 reviewed | schema sound; added 1 column + idempotent migration; no index changes needed |
| 10 Security | 🟡 | `.env` untracked + example + removed hardcoded-cred script; **key rotation still owner action** |
| 11 Env/Deploy | 🟡 | `.env.example`; prod/dev separation still manual |
| 12 Error/logging | 🟢 | backend logger; safe fallbacks across AI flows |
| 13 Testing | 🟢 | builds + lint + service smoke tests; lint baseline 56→8 (Session 5); no automated suite |
| 14 Docs | ✅ | 4 docs maintained |
| 15 Final review | ✅ | below |

## 6. Production-readiness assessment
**Status: functional demo, not production-hardened.** The core student-facing flows work and
now the CV builder no longer loses data. Blocking items before any real deployment:
**secret rotation + history scrub (#1)**, the admin-id decision (#2), and at minimum mobile
nav (#6) and bundle/perf (#7). For **university submission**, the project is in good shape:
features are broad and demoable, documentation is complete, and the highest-visibility bugs
(data loss, persistence, the requested UI fixes) are resolved. Recommend running the manual
verification in `SUBMISSION_PACKAGE.md` §6 and capturing the listed screenshots before submitting.

## 7. Phase 15 — Final review (Senior Engineer / QA / Examiner / Production)
**Strengths for grading.** Broad, cohesive feature set (AI assistant, resume analysis with
explainable ATS scoring, a Jobsuit-style live CV editor with manual + AI editing and two
templates from one data model, scheduling, capstone matching, events scraping, admin panel).
Clean modular backend, documented architecture, and reliable AI flows with deterministic
fallbacks. Builds are green and the bundle is now code-split.

**Grading risks / weak spots (ranked).**
1. **Secrets in git history** — must rotate keys + scrub history before any public submission/deploy. *(Owner action; documented #1.)*
2. **No live end-to-end test evidence** — features are build-verified and unit-smoke-tested, but full runtime (auth via portal scrape, DB migration, chat separation, PDF/DOCX output) is **Not Tested** here; run `SUBMISSION_PACKAGE.md` §6 before the demo and capture screenshots.
3. **Mobile/responsive** — main nav is desktop-first (`min-width:1200px`); fine for a desktop demo, but note it as a known limitation.
4. **Legacy upload-edit path** (`editor.service.ts`) remains brittle; the new structured editor is the recommended path.
5. **Hardcoded admin id** (`"101230004"`) — acceptable for a demo if intentional; document it.

**UX/maintainability.** Two resume-editing surfaces (form builder + live editor) coexist; the
live editor is the stronger experience — consider making it the default next iteration. Lint
baseline still carries pre-existing errors in unrelated pages (RoadMap/Schedule) — safe to
leave for submission, worth clearing for production.

**Verdict:** **University-submission-ready** after the §6 manual run + screenshots. **Not yet
production-ready** until secrets are rotated/scrubbed (#1) and a mobile pass + automated tests
are added. Nothing in this session was committed; review the diff before committing.
