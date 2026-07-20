# MuGate deployment (Railway + Vercel + Supabase)

Architecture:

```
Users → Vercel (frontend)
           ↓  VITE_API_BASE_URL=/api
        Railway (Express backend + Playwright)
           ↓  DATABASE_URL
        Supabase Postgres
```

Supabase is already your database. You only need to deploy the API (always-on) and the static frontend.

---

## Prerequisites

- GitHub repo with this project
- [Railway](https://railway.app) account
- [Vercel](https://vercel.com) account
- Supabase project with schema already applied
- Values from `backend/.env` (never commit real secrets)

Copy templates:

- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
- Mobile: `mobile/.env.example`

---

## 1. Deploy the backend (Railway)

1. New Project → **Deploy from GitHub** → select this repository.
2. Set the service **root directory** to `MuGate/backend` (or `backend` if the repo root is already MuGate).
3. Railway should pick up `Dockerfile` via `railway.toml`. If prompted, choose **Dockerfile** builder.
4. Open **Variables** and set at least:

   | Variable | Notes |
   |----------|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | Leave unset if Railway injects `PORT` (preferred) |
   | `DATABASE_URL` | Supabase pooler connection string |
   | `SUPABASE_PROJECT_REF` | Project ref |
   | `SUPABASE_DB_PASSWORD` | DB password |
   | `JWT_SECRET` | Strong random secret (**≥32 chars**; server refuses weak/missing) |
   | `ENCRYPTION_SECRET` | Strong random secret (**≥32 chars**; rotating invalidates stored portal passwords until re-login) |
   | `SUPER_ADMIN_UNIVERSITY_ID` | Optional immortal admin university ID (e.g. demo admin) |
   | `CORS_ORIGINS` | Comma-separated frontend origins (required in production), e.g. `https://your-app.vercel.app` |
   | `AUTO_INITIAL_CRAWL` | `false` for first boot |
   | `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` / … | Optional; needed for real AI |

5. Deploy and wait for the build (Playwright image is large; first build can take several minutes).
6. Generate a public domain under **Settings → Networking** (e.g. `https://mugate-api.up.railway.app`).
7. Smoke-test:

   ```bash
   curl https://YOUR-RAILWAY-URL/api/health
   ```

   Expect `{ "ok": true, "db": true }`.

8. Test portal login:

   ```bash
   curl -X POST https://YOUR-RAILWAY-URL/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"YOUR_MU_EMAIL\",\"password\":\"YOUR_PASSWORD\"}"
   ```

   Login uses Playwright against the MU portal. If this fails, check Railway logs for Chromium / scrape errors.

---

## 2. Deploy the frontend (Vercel)

1. New Project → Import the same GitHub repo.
2. Set **Root Directory** to `MuGate/frontend` (or `frontend`).
3. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
4. Add environment variables (Production):

   ```
   VITE_API_BASE_URL=https://YOUR-RAILWAY-URL/api
   ```

   Include the `/api` suffix. Rebuild after changing this value (Vite inlines it at build time).

   Optional — Android APK download (hosted outside Vercel; the APK is excluded from the deploy via `.vercelignore`):

   ```
   VITE_APK_URL=https://YOUR-HOST/MuGate.apk
   ```

5. Deploy. Open the site and sign in with an MU account.

Without `VITE_API_BASE_URL`, production API calls fail loudly (they will not invent `hostname:5000`).

---

## 3. Mobile (optional)

In `MuGate/mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://mugate-production.up.railway.app/api
```

Rebuild the Expo app / EAS profile so the new URL is bundled.

---

## Smoke test checklist

| Check | Pass criteria |
|--------|----------------|
| `GET /api/health` | `200` and `ok: true` |
| Portal login | JWT / success payload |
| Schedules / history | Data loads from Supabase via API |
| Frontend network tab | Calls Railway URL, not `localhost:5000` |
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

- Free-tier hosts that **sleep** when idle will make login look randomly broken; keep the Railway service awake for demos (paid plan / no-sleep, or an external uptime ping to `GET /api/health` every few minutes). The web app also fires a short wake ping on first load.
- RAG bootstrap runs after the HTTP server is listening so `/api/health` answers during warm-up.
- Do not commit `.env` files. Use platform secret dashboards only.
- SQL Server / `msnodesqlv8` is local-only. Production must set `DATABASE_URL` so the backend uses Supabase Postgres.
- Hashed frontend assets under `/assets/*` are long-cached on Vercel (`immutable`). The APK is not shipped with the Vercel deploy — set `VITE_APK_URL` instead.
