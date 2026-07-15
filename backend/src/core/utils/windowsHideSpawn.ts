/**
 * Hide Playwright/Chrome console flashes on Windows.
 *
 * Must patch the real CommonJS `child_process` module (via require), not an
 * ESM default-import wrapper — Playwright calls require("child_process").spawn.
 */
const cp = require("child_process") as typeof import("child_process");

let applied = false;

function withWindowsHide<T extends Record<string, unknown> | undefined>(options: T): T & { windowsHide: boolean } {
    return { ...(options || {}), windowsHide: (options as any)?.windowsHide ?? true } as T & { windowsHide: boolean };
}

export function enableWindowsHideForSpawns(): void {
    if (applied || process.platform !== "win32") return;
    applied = true;

    const originalSpawn = cp.spawn.bind(cp);
    const originalSpawnSync = cp.spawnSync.bind(cp);

    cp.spawn = ((command: any, args?: any, options?: any) => {
        if (Array.isArray(args) || args === undefined) {
            return originalSpawn(command, args, withWindowsHide(options));
        }
        return originalSpawn(command, withWindowsHide(args));
    }) as typeof cp.spawn;

    cp.spawnSync = ((command: any, args?: any, options?: any) => {
        if (Array.isArray(args) || args === undefined) {
            return originalSpawnSync(command, args, withWindowsHide(options));
        }
        return originalSpawnSync(command, withWindowsHide(args));
    }) as typeof cp.spawnSync;
}

enableWindowsHideForSpawns();
