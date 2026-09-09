# MuGate

**University student platform** for Al Maaref University (MU): RAG chatbot, resume/CV AI, scheduling, and admin tools — with a live demo at [mugate.org](https://mugate.org).

> **Note:** [MUGATE/mu.gate](https://github.com/MUGATE/mu.gate) is the archived legacy sibling. This repo (**MuGate**) is the current codebase.

## Problem

Students juggle scattered portals, unclear academic guidance, and weak resume tooling. MuGate brings portal-aware AI help, CV building, schedule support, and admin ops into one web (and mobile) experience.

## Features

| Feature | What it does |
|--------|----------------|
| **MuChat (RAG)** | University-aware assistant with retrieval over campus knowledge (ChromaDB) plus student context |
| **Resume AI** | Analyze, enhance, and build CVs; PDF/DOCX export and live editor |
| **Schedule** | Course/schedule helpers tied to academic data |
| **Admin** | Control panel for knowledge, events, and ops |
| **Mobile** | Companion Expo/React Native app (APK via releases) |

Also includes capstone matching, internships, events, and roadmap views in the portal UI.

## Live demo

- **Web:** [https://mugate.org](https://mugate.org)
- API health (production): your Render service `/api/health`

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite (Tailwind), hosted on **Vercel** |
| Backend | Express + TypeScript, hosted on **Render** |
| Database | **Supabase** Postgres |
| RAG / vectors | **ChromaDB** |
| Auth | JWT + university portal verification |
| AI | Multi-provider cascade (e.g. DeepSeek / Gemini / OpenRouter) |
| Mobile | Expo / React Native |

Deploy details: see **[DEPLOY.md](./DEPLOY.md)** (Render + Vercel + Supabase).

## Local setup

1. Clone https://github.com/MUGATE/MuGate.git
2. Start the API from the backend folder after copying its env example
3. Start the web app from the frontend folder after copying its env example
4. Optional mobile app from the mobile folder after copying its env example
Env templates: backend/.env.example frontend/.env.example mobile/.env.example
Production deploy guide: [DEPLOY.md](./DEPLOY.md)

## Repo layout

- frontend/ — React + Vite web app
- backend/ — Express + TypeScript API
- mobile/ — Expo / React Native client
- supabase/ — DB-related assets
- docs/internal/ — internal notes (not recruiter-facing)
- scripts/ — utility scripts
- render.yaml, vercel.json, DEPLOY.md — deploy config and guide

## License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE).

## Related

- Legacy archived repo: [MUGATE/mu.gate](https://github.com/MUGATE/mu.gate)
- Internal working notes: [docs/internal/](./docs/internal/)
