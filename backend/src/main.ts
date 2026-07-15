import "./core/utils/windowsHideSpawn"; // hide Playwright console flashes on Windows
import app from "./app";
import open from "open";
import { env } from "./config/env";
import path from "path";

// Cursor agent shells redirect Playwright browsers into a temp cache. Prefer the
// real user install so login/scrape use chrome-headless-shell instead of flashing Chrome.
const browserPath = process.env.PLAYWRIGHT_BROWSERS_PATH || "";
if (browserPath.toLowerCase().includes("cursor-sandbox-cache")) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
    process.env.LOCALAPPDATA || "",
    "ms-playwright"
  );
}

const PORT = Number(env.port) || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`LAN access: http://<your-ip>:${PORT}`);

  if (process.env.NODE_ENV !== "production") {
    await open(`http://localhost:${PORT}`);
  }
});
