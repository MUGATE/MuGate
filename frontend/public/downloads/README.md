# Android APK for the download page

The Download page (`/download`) uses **`VITE_APK_URL`** (absolute CDN or hosting URL).
The APK is **not** shipped in the Vercel/vite `dist` output (see `.vercelignore` and the
`omit-public-apks` Vite plugin) so deploys stay lean.

## Local / staging

Set in `.env` / Vercel env:

```bash
VITE_APK_URL=https://your-cdn.example/mugate.apk
```

Optional local file for manual testing only (ignored by deploy):

`public/downloads/mugate.apk`

## Rebuild

```bash
cd MuGate/mobile
npx eas-cli build --platform android --profile preview --non-interactive
```

Upload the artifact to your CDN, then set `VITE_APK_URL` to that URL.

Update `EXPO_PUBLIC_API_URL` in `mobile/eas.json` (and `.env`) before rebuilding if the backend URL changes (LAN IP or Railway).
