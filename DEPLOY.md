# MuGate deployment (Render + Vercel + Supabase)

Architecture:

```
Users → Vercel (frontend)
           ↓  VITE_API_BASE_URL=https://….onrender.com/api
        Render (Express backend + Playwright)
           ↓  DATABASE_URL
        Supabase Postgres
```

Supabase is already your database. You only need to deploy the API (always-on) and the static frontend.

---

## Prerequisites

- GitHub repo with this project ([MUGATE/MuGate](https://github.com/MUGATE/MuGate))
- [Render](https://dashboard.render.com) account (GitHub connected)
- [Vercel](https://vercel.com) account
- Supabase project with schema already applied
- Values from `backend/.env` (never commit real secrets)

Copy templates:

- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
- Mobile: `mobile/.env.example`

---

## 1. Deploy the backend (Render)

Preferred: use the Blueprint at [`render.yaml`](render.yaml) (repo root).

1. Open [Render → New Blueprint](https://dashboard.render.com/blueprints/new) **or** [New Web Service](https://dashboard.render.com/web/new).
2. Connect GitHub → select **MUGATE/MuGate**, branch **main**.
3. If using the web service form (not Blueprint), set:

   | Field | Value |
   |-------|--------|
   | Language / runtime | **Docker** |
   | Root Directory | `backend` |
   | Dockerfile Path | `./Dockerfile` |
   | Instance type | **Standard** (2 GB) — required for Playwright |
   | Region | **Frankfurt** (cannot change later) |
   | Health Check Path | `/api/health` |

4. Open **Environment** and set at least:

   | Variable | Notes |
   |----------|--------|
   | `NODE_ENV` | `production` (Blueprint sets this) |
   | `PORT` | Leave unset — Render injects `PORT` |
   | `DATABASE_URL` | Supabase pooler connection string |
   | `SUPABASE_PROJECT_REF` | Project ref |
   | `SUPABASE_DB_PASSWORD` | DB password |
   | `JWT_SECRET` | Strong random secret (**≥32 chars**; server refuses weak/missing) |
   | `ENCRYPTION_SECRET` | Strong random secret (**≥32 chars**; rotating invalidates stored portal passwords until re-login) |
   | `SUPER_ADMIN_UNIVERSITY_ID` | Optional immortal admin university ID (e.g. demo admin) |
   | `CORS_ORIGINS` | Must include `https://mugate.org` (Blueprint default also has www + vercel.app) |
   | `AUTO_INITIAL_CRAWL` | `false` for first boot |
   | `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` / … | Optional; needed for real AI |

5. Deploy and wait for the build (Playwright image is large; first build can take 10–15 minutes).
6. Note the public URL (e.g. `https://mugate-api-xxxx.onrender.com`).
7. Smoke-test:

   ```bash
   curl https://YOUR-RENDER-URL/api/health
   ```

   Expect `{ "ok": true, "db": true }`.

8. Test portal login:

   ```bash
   curl -X POST https://YOUR-RENDER-URL/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"YOUR_MU_EMAIL\",\"password\":\"YOUR_PASSWORD\"}"
   ```

   Login uses Playwright against the MU portal. If this fails, check Render logs for Chromium / scrape errors.

Optional later: attach custom domain `api.mugate.org` under **Settings → Custom Domains**.

---

## 2. Deploy the frontend (Vercel)

1. New Project → Import the same GitHub repo.
2. Set **Root Directory** to `MuGate/frontend` (or `frontend`).
3. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
4. Add environment variables (Production):

   ```
   VITE_API_BASE_URL=https://YOUR-RENDER-URL/api
   ```

   Include the `/api` suffix. Rebuild after changing this value (Vite inlines it at build time).

   Optional — Android APK download (hosted outside Vercel; the APK is excluded from the deploy via `.vercelignore`):

   ```
   VITE_APK_URL=https://github.com/MUGATE/MuGate/releases/download/v1.0.2/mugate.apk
   ```

   SPA routes (`/download`, `/about`, …) are handled by [`vercel.json`](vercel.json) at the **repo root** (this project builds with Root Directory = repo root + `cd frontend` install/build commands, so `frontend/vercel.json` is not applied).

5. Deploy. Open https://mugate.org and sign in with an MU account.

Without `VITE_API_BASE_URL`, production API calls fail loudly (they will not invent `hostname:5000`).

---

## 3. Mobile (optional)

In `MuGate/mobile/.env` (and EAS profiles):

```
EXPO_PUBLIC_API_URL=https://YOUR-RENDER-URL/api
```

Rebuild the Expo app / EAS profile so the new URL is bundled. Update this before retiring any previous Railway URL.

---

## Smoke test checklist

| Check | Pass criteria |
|--------|----------------|
| `GET /api/health` | `200` and `ok: true` |
| Portal login | JWT / success payload |
| Schedules / history | Data loads from Supabase via API |
| Frontend network tab | Calls Render URL, not `localhost:5000` |
| Laptop powered off | Site and API still work |

---

## Local production-style run (optional)

```bash
cd MuGate/backend
npm ci
npm run build
NODE_ENV=production npm start
```

Docker (requires Docker Desktop):

```bash
cd MuGate/backend
docker build -t mugate-backend .
docker run --rm -p 5000:5000 --env-file .env -e PORT=5000 mugate-backend
```

---

## Notes

- Playwright needs **≥2 GB RAM** — use Render **Standard**, not Free/Starter.
- Free-tier hosts that **sleep** when idle will make login look randomly broken; keep the API awake for demos (paid plan, or an external uptime ping to `GET /api/health` every few minutes). The web app also fires a short wake ping on first load.
- RAG bootstrap runs after the HTTP server is listening so `/api/health` answers during warm-up.
- Do not commit `.env` files. Use platform secret dashboards only.
- SQL Server / `msnodesqlv8` is local-only. Production must set `DATABASE_URL` so the backend uses Supabase Postgres.
- Hashed frontend assets under `/assets/*` are long-cached on Vercel (`immutable`). The APK is not shipped with the Vercel deploy — set `VITE_APK_URL` instead.
- Legacy `backend/railway.toml` may remain until Railway is fully retired; new deploys use Render.
