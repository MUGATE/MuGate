# MuGate Mobile (Expo / React Native)

Native Android + iOS app for MuGate. Uses the same Express API and SQL Server database as the web app.

## Prerequisites

- Node.js 18+
- Backend running on your PC (`MuGate/backend`)
- Phone and PC on the **same Wi-Fi**
- [Expo Go](https://expo.dev/go) on your phone (for dev)

## Setup

```bash
cd mobile
npm install
```

**No IP configuration needed.** The app auto-detects your PC's IP from the same
host Expo serves the bundle on (`Constants.expoConfig.hostUri`), so it always
points at a reachable address even when your PC has multiple network adapters.

Only if auto-detection fails, copy `.env.example` to `.env` and set the IP that
Expo printed (the one in `exp://10.x.x.x`):

```
EXPO_PUBLIC_API_URL=http://10.158.174.212:5000/api
```

## Run backend (separate terminal)

```bash
cd ../backend
npm run dev
```

Backend listens on `0.0.0.0:5000` for LAN access.

Also install Playwright browsers once: `npx playwright install chromium`

### Allow port 5000 through Windows Firewall (one time)

The phone can't reach the backend until port 5000 is open. Run **PowerShell as
Administrator** and execute:

```powershell
New-NetFirewallRule -DisplayName "MuGate Backend 5000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -Profile Private,Domain
```

Or just run the helper script (it self-elevates):

```powershell
./scripts/allow-firewall.ps1
```

Verify from your **phone's browser**: open `http://<the-ip-expo-printed>:5000/test-db`.
You should see a JSON response, not a timeout.

## Run mobile app

```bash
npm start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

## Project structure

- `src/api/` — API client (ported from web `frontend/src/services/`)
- `src/navigation/` — React Navigation (tabs + stacks)
- `src/screens/` — Native screens per feature
- `src/context/AuthContext.tsx` — JWT auth via SecureStore

## Features

| Tab | Screens |
|-----|---------|
| Home | Welcome + quick access |
| MuChat | AI chat with session drawer |
| Tools | Schedule, Resume, Capstone, Roadmap |
| Explore | Internships, Events |
| Profile | Login, About, Admin |

## Build for production

```bash
npx eas build --platform android
npx eas build --platform ios
```

Requires [EAS CLI](https://docs.expo.dev/build/setup/) and Expo account.
