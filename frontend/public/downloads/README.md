# Android APK for the download page

The site serves the APK at `/downloads/mugate.apk`. The Download page (`/download`) links to that URL.

Current file: `mugate.apk` (built with EAS `preview` profile).

## Rebuild

```bash
cd MuGate/mobile
npx eas-cli build --platform android --profile preview --non-interactive
```

Then download the artifact from the Expo dashboard (or the CLI URL) and replace this file:

```bash
# example
curl -L -o frontend/public/downloads/mugate.apk "https://expo.dev/artifacts/eas/...."
```

Update `EXPO_PUBLIC_API_URL` in `mobile/eas.json` (and `.env`) before rebuilding if the backend URL changes (LAN IP or Railway).
