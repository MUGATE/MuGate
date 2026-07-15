/**
 * Local installs: download Chromium + apply Windows spawn hide patch.
 * Docker / CI with PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1: patch only (browsers from image).
 */
const { spawnSync } = require("child_process");
const path = require("path");

const skipBrowsers =
  process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1" ||
  process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "true";

if (!skipBrowsers) {
  const install = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["playwright", "install", "chromium"],
    { stdio: "inherit", shell: process.platform === "win32" }
  );
  if (install.status !== 0) {
    process.exit(install.status || 1);
  }
} else {
  console.log("[postinstall] Skipping Playwright browser download (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD)");
}

const patch = spawnSync(
  process.execPath,
  [path.join(__dirname, "patch-playwright-windows-hide.js")],
  { stdio: "inherit" }
);
process.exit(patch.status || 0);
