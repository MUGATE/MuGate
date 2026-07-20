import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const sep = path.sep;

function isPathInsidePackage(id, packageName) {
  const unix = `/node_modules/${packageName}/`;
  const win = `\\node_modules\\${packageName}\\`;
  return id.includes(unix) || id.includes(win);
}

/** Strip large APKs from dist — use VITE_APK_URL / CDN instead of shipping in public/. */
function omitPublicApks() {
  return {
    name: "omit-public-apks",
    closeBundle() {
      const downloadsDir = path.resolve(__dirname, "dist/downloads");
      if (!fs.existsSync(downloadsDir)) return;
      for (const name of fs.readdirSync(downloadsDir)) {
        if (name.toLowerCase().endsWith(".apk")) {
          fs.unlinkSync(path.join(downloadsDir, name));
          console.log(`[omit-public-apks] removed dist/downloads/${name}`);
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), omitPublicApks()],
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep Vite's preload helper out of heavy vendor chunks (otherwise the
          // entry imports three-vendor solely for __vitePreload and downloads ~900KB).
          if (
            id.includes("vite/preload-helper") ||
            id.includes("\0vite/preload-helper") ||
            id.includes("vite/modulepreload-polyfill")
          ) {
            return "react-vendor";
          }

          if (!id.includes("node_modules")) return;

          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router") ||
            isPathInsidePackage(id, "react") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react-vendor";
          }

          // Path-scoped only — never broad `includes('three')`.
          if (
            isPathInsidePackage(id, "three") ||
            id.includes(`${sep}node_modules${sep}@react-three${sep}`) ||
            id.includes("/node_modules/@react-three/") ||
            id.includes("\\node_modules\\@react-three\\")
          ) {
            return "three-vendor";
          }

          if (
            id.includes("react-markdown") ||
            id.includes("remark-gfm") ||
            id.includes("/remark-") ||
            id.includes("\\remark-") ||
            id.includes("/mdast-") ||
            id.includes("\\mdast-") ||
            id.includes("/micromark") ||
            id.includes("\\micromark") ||
            id.includes("/unist-") ||
            id.includes("\\unist-")
          ) {
            return "markdown-vendor";
          }

          if (id.includes("@dnd-kit")) {
            return "dnd-vendor";
          }
        },
      },
    },
  },
});
