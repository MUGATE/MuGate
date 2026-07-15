/**
 * Patches playwright-core so browser/taskkill spawns use windowsHide on Windows.
 * Re-run automatically via the postinstall script after npm install.
 */
const fs = require("fs");
const path = require("path");

const target = path.join(
    __dirname,
    "..",
    "node_modules",
    "playwright-core",
    "lib",
    "coreBundle.js"
);

if (!fs.existsSync(target)) {
    console.warn("[patch-playwright-windows-hide] playwright-core not found, skipping");
    process.exit(0);
}

let source = fs.readFileSync(target, "utf8");
const marker = "/* mugate-windowsHide */";

if (source.includes(marker)) {
    console.log("[patch-playwright-windows-hide] already applied");
    process.exit(0);
}

const before = `  const spawnOptions = {
    // On non-windows platforms, \`detached: true\` makes child process a leader of a new
    // process group, making it possible to kill child process tree with \`.kill(-pid)\` command.
    // @see https://nodejs.org/api/child_process.html#child_process_options_detached
    detached: process.platform !== "win32",
    env: options2.env,
    cwd: options2.cwd,
    shell: options2.shell,
    stdio
  };`;

const after = `  const spawnOptions = {
    // On non-windows platforms, \`detached: true\` makes child process a leader of a new
    // process group, making it possible to kill child process tree with \`.kill(-pid)\` command.
    // @see https://nodejs.org/api/child_process.html#child_process_options_detached
    detached: process.platform !== "win32",
    env: options2.env,
    cwd: options2.cwd,
    shell: options2.shell,
    stdio,
    windowsHide: true ${marker}
  };`;

if (!source.includes(before)) {
    // Fallback: less brittle match for minified / version drift
    const loose = /stdio\n  \};/;
    if (loose.test(source) && source.includes("async function launchProcess")) {
        source = source.replace(
            /(async function launchProcess\(options2\) \{[\s\S]*?stdio)\n  \};/,
            `$1,\n    windowsHide: true ${marker}\n  };`
        );
    } else {
        console.warn("[patch-playwright-windows-hide] launchProcess spawnOptions pattern not found");
        process.exit(0);
    }
} else {
    source = source.replace(before, after);
}

// Hide taskkill console flash when closing the browser
source = source.replace(
    "childProcess.spawnSync(`taskkill /pid ${spawnedProcess.pid} /T /F`, { shell: true })",
    `childProcess.spawnSync(\`taskkill /pid \${spawnedProcess.pid} /T /F\`, { shell: true, windowsHide: true ${marker} })`
);

fs.writeFileSync(target, source, "utf8");
console.log("[patch-playwright-windows-hide] applied to playwright-core");
