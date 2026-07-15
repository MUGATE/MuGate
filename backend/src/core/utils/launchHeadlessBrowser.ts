import { chromium, Browser, LaunchOptions } from "playwright";
import { spawn, ChildProcess, execSync } from "child_process";
import net from "net";
import fs from "fs";
import path from "path";
import { logger } from "../logger/logger";
import "./windowsHideSpawn";

/** Shared Chromium flags that keep headless launches invisible on Windows. */
export const HEADLESS_BROWSER_ARGS = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-software-rasterizer",
    "--mute-audio",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-breakpad",
    "--metrics-recording-only",
    // Off-screen fallback if a window is still created
    "--window-position=-32000,-32000",
    "--window-size=800,600",
];

function findSystemBrowser(): { label: string; executablePath: string } | null {
    if (process.platform !== "win32") return null;

    const candidates: Array<{ label: string; paths: string[] }> = [
        {
            label: "system-chrome",
            paths: [
                process.env.CHROME_PATH || "",
                path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
                path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
                path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
            ],
        },
        {
            label: "system-edge",
            paths: [
                path.join(process.env.PROGRAMFILES || "", "Microsoft", "Edge", "Application", "msedge.exe"),
                path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
            ],
        },
    ];

    for (const candidate of candidates) {
        for (const p of candidate.paths) {
            if (p && fs.existsSync(p)) return { label: candidate.label, executablePath: p };
        }
    }

    // Last resort: where.exe
    try {
        const whereChrome = execSync("where chrome", { encoding: "utf8", windowsHide: true as any }).trim().split(/\r?\n/)[0];
        if (whereChrome && fs.existsSync(whereChrome)) {
            return { label: "system-chrome", executablePath: whereChrome };
        }
    } catch {
        /* ignore */
    }

    return null;
}

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                server.close();
                reject(new Error("Could not allocate a free port"));
                return;
            }
            const { port } = address;
            server.close((err) => (err ? reject(err) : resolve(port)));
        });
    });
}

async function waitForCdp(port: number, timeoutMs = 15000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/json/version`);
            if (res.ok) return;
        } catch {
            /* retry */
        }
        await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(`Timed out waiting for Chrome CDP on port ${port}`);
}

type ManagedBrowser = Browser & { __mugateChild?: ChildProcess };

/**
 * Spawn Chrome/Edge ourselves with windowsHide + headless, then connect over CDP.
 * Avoids Playwright's channel:chrome launch which flashes a black window on Windows.
 */
async function launchSystemBrowserViaCdp(): Promise<Browser> {
    const browserInfo = findSystemBrowser();
    if (!browserInfo) throw new Error("No system Chrome/Edge executable found");

    const port = await getFreePort();
    const args = [
        ...HEADLESS_BROWSER_ARGS,
        `--remote-debugging-port=${port}`,
        "--remote-debugging-address=127.0.0.1",
        "--user-data-dir=" + path.join(process.env.TEMP || ".", `mugate-pw-${port}`),
        "about:blank",
    ];

    const child = spawn(browserInfo.executablePath, args, {
        windowsHide: true,
        stdio: "ignore",
        detached: false,
    });

    child.on("error", (err) => {
        logger.warn(`System browser process error: ${err.message}`);
    });

    try {
        await waitForCdp(port);
        const browser = (await chromium.connectOverCDP(`http://127.0.0.1:${port}`)) as ManagedBrowser;
        browser.__mugateChild = child;

        const originalClose = browser.close.bind(browser);
        browser.close = async () => {
            try {
                await originalClose();
            } finally {
                if (!child.killed) {
                    try {
                        child.kill();
                    } catch {
                        /* ignore */
                    }
                }
            }
        };

        logger.info(`Launched browser via ${browserInfo.label} (CDP, hidden)`);
        return browser;
    } catch (err) {
        if (!child.killed) {
            try {
                child.kill();
            } catch {
                /* ignore */
            }
        }
        throw err;
    }
}

/**
 * Launch a headless browser for scraping/login.
 * Falls back to a locally spawned (windowsHide) Chrome/Edge CDP connection.
 */
export async function launchHeadlessBrowser(
    extraArgs: string[] = []
): Promise<Browser> {
    const args = [...HEADLESS_BROWSER_ARGS, ...extraArgs];
    const launchAttempts: Array<{ label: string; options: LaunchOptions }> = [
        // Prefer bundled chrome-headless-shell — never creates a visible window
        { label: "bundled-chromium", options: { headless: true, args } },
    ];

    let lastError: Error | null = null;
    for (const attempt of launchAttempts) {
        try {
            const browser = await chromium.launch(attempt.options);
            logger.info(`Launched browser via ${attempt.label}`);
            return browser;
        } catch (err: any) {
            lastError = err;
            logger.warn(`Browser launch failed (${attempt.label}): ${err?.message || err}`);
        }
    }

    try {
        return await launchSystemBrowserViaCdp();
    } catch (err: any) {
        lastError = err;
        logger.warn(`Browser launch failed (system-cdp): ${err?.message || err}`);
    }

    throw lastError ?? new Error("Could not launch a headless browser.");
}
