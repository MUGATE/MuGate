/**
 * Compress / resize media for production:
 * - Instructor + resume + people → max display×DPR WebP + AVIF
 * - Internship logos → resized PNG/WebP
 * - Hero video → smaller H.264 + poster (public + assets)
 * - Favicon → real 48×48 PNG
 * - Fonts → WOFF2 + copy to public/fonts for early preload
 *
 * Usage: node scripts/compress-home-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const homeAssets = path.join(frontendRoot, "src/pages/Home/assets");
const publicDir = path.join(frontendRoot, "public");

/** Display cards ~300×420 @2x → cover-crop to exact card ratio */
const INSTRUCTOR_WIDTH = 600;
const INSTRUCTOR_HEIGHT = 840;
const RESUME_MAX = 1200;
const PEOPLE_MAX = 800;
const LOGO_MAX = 512;
const NAV_LOGO_MAX = 256;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function buildResizedPipeline(src, maxEdge) {
  const meta = await sharp(src).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  let pipeline = sharp(src).rotate();
  if (maxEdge && (w > maxEdge || h > maxEdge)) {
    pipeline = sharp(src)
      .rotate()
      .resize({
        width: w >= h ? maxEdge : undefined,
        height: h > w ? maxEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
  }
  return pipeline;
}

async function toWebpAndAvif(src, destWebp, { maxEdge, quality = 78, avifQuality = 50 } = {}) {
  const pipeline = await buildResizedPipeline(src, maxEdge);
  const destAvif = destWebp.replace(/\.webp$/i, ".avif");

  await pipeline.clone().webp({ quality, effort: 6 }).toFile(destWebp);
  await pipeline.clone().avif({ quality: avifQuality, effort: 4 }).toFile(destAvif);

  const before = fs.statSync(src).size;
  const afterWebp = fs.statSync(destWebp).size;
  const afterAvif = fs.statSync(destAvif).size;
  const outMeta = await sharp(destWebp).metadata();
  console.log(
    `  ${path.basename(src)} → ${path.basename(destWebp)}/${path.basename(destAvif)}: ${(before / 1e6).toFixed(2)} MB → webp ${(afterWebp / 1e6).toFixed(2)} MB, avif ${(afterAvif / 1e6).toFixed(2)} MB (${outMeta.width}×${outMeta.height})`
  );
}

/** Cover-crop to portrait card box so landscape instructor shots fill 300×420. */
async function toInstructorWebpAndAvif(src, destWebp, { quality = 78, avifQuality = 50 } = {}) {
  const pipeline = sharp(src)
    .rotate()
    .resize({
      width: INSTRUCTOR_WIDTH,
      height: INSTRUCTOR_HEIGHT,
      fit: "cover",
      position: "centre",
    });
  const destAvif = destWebp.replace(/\.webp$/i, ".avif");

  await pipeline.clone().webp({ quality, effort: 6 }).toFile(destWebp);
  await pipeline.clone().avif({ quality: avifQuality, effort: 4 }).toFile(destAvif);

  const before = fs.statSync(src).size;
  const afterWebp = fs.statSync(destWebp).size;
  const afterAvif = fs.statSync(destAvif).size;
  const outMeta = await sharp(destWebp).metadata();
  console.log(
    `  ${path.basename(src)} → ${path.basename(destWebp)}/${path.basename(destAvif)}: ${(before / 1e6).toFixed(2)} MB → webp ${(afterWebp / 1e6).toFixed(2)} MB, avif ${(afterAvif / 1e6).toFixed(2)} MB (${outMeta.width}×${outMeta.height})`
  );
}

async function resizeRasterInPlace(src, { maxEdge, quality = 82 } = {}) {
  const meta = await sharp(src).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!maxEdge || (w <= maxEdge && h <= maxEdge)) {
    console.log(`  skip ${path.basename(src)} (${w}×${h})`);
    return;
  }

  const ext = path.extname(src).toLowerCase();
  const tmp = `${src}.tmp${ext}`;
  let pipeline = sharp(src)
    .rotate()
    .resize({
      width: w >= h ? maxEdge : undefined,
      height: h > w ? maxEdge : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (ext === ".png") {
    await pipeline.png({ compressionLevel: 8, palette: true }).toFile(tmp);
  } else if (ext === ".jpg" || ext === ".jpeg") {
    await pipeline.jpeg({ quality, mozjpeg: true }).toFile(tmp);
  } else if (ext === ".webp") {
    await pipeline.webp({ quality, effort: 6 }).toFile(tmp);
  } else {
    return;
  }

  const before = fs.statSync(src).size;
  fs.renameSync(tmp, src);
  const after = fs.statSync(src).size;
  const out = await sharp(src).metadata();
  console.log(
    `  ${path.basename(src)}: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB (${out.width}×${out.height})`
  );
}

async function convertImages() {
  const instructorDir = path.join(homeAssets, "Images/Instructor");
  const cvDir = path.join(homeAssets, "Images/Cv");
  const peopleDir = path.join(homeAssets, "Images/People");
  const imagesDir = path.join(homeAssets, "Images");

  console.log("Converting instructor PNGs → 600×840 cover-crop WebP + AVIF…");
  for (const name of fs.readdirSync(instructorDir)) {
    if (!name.toLowerCase().endsWith(".png")) continue;
    const src = path.join(instructorDir, name);
    const dest = path.join(instructorDir, name.replace(/\.png$/i, ".webp"));
    await toInstructorWebpAndAvif(src, dest, { quality: 78 });
  }

  console.log("Converting resume PNG…");
  const resumeSrc = path.join(cvDir, "Abed Resume.png");
  if (fs.existsSync(resumeSrc)) {
    await toWebpAndAvif(resumeSrc, path.join(cvDir, "Abed Resume.webp"), {
      maxEdge: RESUME_MAX,
      quality: 80,
    });
  }

  console.log("Resizing people photos → WebP + AVIF…");
  if (fs.existsSync(peopleDir)) {
    for (const name of fs.readdirSync(peopleDir)) {
      if (!/\.(jpe?g|png)$/i.test(name)) continue;
      const src = path.join(peopleDir, name);
      const dest = path.join(peopleDir, name.replace(/\.(jpe?g|png)$/i, ".webp"));
      await toWebpAndAvif(src, dest, { maxEdge: PEOPLE_MAX, quality: 75 });
    }
  }

  // Also emit AVIF next to existing WebP when PNG/JPG sources are gone
  console.log("Ensuring AVIF siblings for existing WebP…");
  for (const dir of [instructorDir, cvDir, peopleDir]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.toLowerCase().endsWith(".webp")) continue;
      const webpPath = path.join(dir, name);
      const avifPath = webpPath.replace(/\.webp$/i, ".avif");
      if (fs.existsSync(avifPath)) continue;
      await sharp(webpPath).avif({ quality: 50, effort: 4 }).toFile(avifPath);
      console.log(`  ${name} → ${path.basename(avifPath)}`);
    }
  }

  console.log("Resizing nav / download logos…");
  for (const [file, max] of [
    ["Logo2 colored.png", NAV_LOGO_MAX],
    ["mugate-logo-3d.png", 640],
  ]) {
    const src = path.join(imagesDir, file);
    if (fs.existsSync(src)) await resizeRasterInPlace(src, { maxEdge: max });
  }
}

async function compressInternshipLogos() {
  const logoDir = path.join(frontendRoot, "src/pages/Internship/Logos");
  if (!fs.existsSync(logoDir)) return;

  console.log("Resizing internship logos…");
  for (const name of fs.readdirSync(logoDir)) {
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
    await resizeRasterInPlace(path.join(logoDir, name), {
      maxEdge: LOGO_MAX,
      quality: 85,
    });
  }
}

async function makeFavicon() {
  // Prefer the blue/yellow 3D mark (not the flat dark "Logo2 colored" silhouette).
  const srcCandidates = [
    path.join(homeAssets, "Images/Logo2.png"),
    path.join(frontendRoot, "public/Logo2.png"),
    path.join(homeAssets, "Images/mugate-logo-3d.png"),
  ];
  const src = srcCandidates.find((p) => fs.existsSync(p));
  if (!src) {
    console.warn("Favicon source not found, skipping");
    return;
  }
  const dest = path.join(publicDir, "favicon-48.png");
  await sharp(src)
    .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(dest);
  console.log(`  favicon ← ${path.basename(src)} → public/favicon-48.png (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
}

async function convertFontsToWoff2() {
  let ttf2woff2;
  try {
    ttf2woff2 = (await import("ttf2woff2")).default;
  } catch {
    console.warn("ttf2woff2 not installed — skip WOFF2 (npm i -D ttf2woff2)");
    return;
  }

  const fontDir = path.join(homeAssets, "Fonts");
  console.log("Converting TTF → WOFF2…");
  for (const name of fs.readdirSync(fontDir)) {
    if (!name.toLowerCase().endsWith(".ttf")) continue;
    if (name.toUpperCase() === "IMPACT.TTF") continue; // unused system fallback
    const src = path.join(fontDir, name);
    const dest = path.join(fontDir, name.replace(/\.ttf$/i, ".woff2"));
    const input = fs.readFileSync(src);
    fs.writeFileSync(dest, ttf2woff2(input));
    console.log(
      `  ${name} → ${path.basename(dest)}: ${(input.length / 1024).toFixed(0)} KB → ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`
    );
  }
}

/** Copy WOFF2 + hero poster into public/ for early HTML preloads (stable URLs). */
function publishLcpAssets() {
  const fontDir = path.join(homeAssets, "Fonts");
  const publicFonts = path.join(publicDir, "fonts");
  ensureDir(publicFonts);

  console.log("Publishing fonts to public/fonts…");
  for (const name of fs.readdirSync(fontDir)) {
    if (!name.toLowerCase().endsWith(".woff2")) continue;
    fs.copyFileSync(path.join(fontDir, name), path.join(publicFonts, name));
    console.log(`  ${name}`);
  }

  const posterSrc = path.join(homeAssets, "Videos/MU VIDEO LANDING PAGE.poster.webp");
  const posterPublic = path.join(publicDir, "home-hero-poster.webp");
  if (fs.existsSync(posterSrc)) {
    fs.copyFileSync(posterSrc, posterPublic);
    console.log("  home-hero-poster.webp");
  } else {
    console.warn("Hero poster not found — run video compress first");
  }

  const posterAvifSrc = path.join(homeAssets, "Videos/MU VIDEO LANDING PAGE.poster.avif");
  if (fs.existsSync(posterAvifSrc)) {
    fs.copyFileSync(posterAvifSrc, path.join(publicDir, "home-hero-poster.avif"));
    console.log("  home-hero-poster.avif");
  }

  const videoSrc = path.join(homeAssets, "Videos/MU VIDEO LANDING PAGE.compressed.mp4");
  const videoPublic = path.join(publicDir, "home-hero.mp4");
  if (fs.existsSync(videoSrc)) {
    fs.copyFileSync(videoSrc, videoPublic);
    console.log("  home-hero.mp4");
  } else {
    console.warn("Compressed hero video not found — run video compress first");
  }
}

function runFfmpeg(args) {
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    throw new Error("ffmpeg-static binary not found");
  }
  const result = spawnSync(ffmpegPath, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed with status ${result.status}`);
  }
}

async function compressVideo() {
  const videoDir = path.join(homeAssets, "Videos");
  const src = path.join(videoDir, "MU VIDEO LANDING PAGE.mp4");
  const dest = path.join(videoDir, "MU VIDEO LANDING PAGE.compressed.mp4");
  const poster = path.join(videoDir, "MU VIDEO LANDING PAGE.poster.webp");
  const posterAvif = path.join(videoDir, "MU VIDEO LANDING PAGE.poster.avif");

  if (!fs.existsSync(src)) {
    console.warn("Hero video not found, skipping video compress");
    // Still try AVIF from existing poster webp
    if (fs.existsSync(poster) && !fs.existsSync(posterAvif)) {
      await sharp(poster).avif({ quality: 48, effort: 4 }).toFile(posterAvif);
      console.log(`  poster avif from existing webp`);
    }
    return;
  }

  console.log("Re-encoding hero video (720p H.264)…");
  runFfmpeg([
    "-y",
    "-i",
    src,
    "-vf",
    "scale=-2:720",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-an",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    dest,
  ]);

  console.log("Extracting poster frame…");
  const posterJpg = path.join(videoDir, "MU VIDEO LANDING PAGE.poster.jpg");
  runFfmpeg([
    "-y",
    "-ss",
    "1",
    "-i",
    dest,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    posterJpg,
  ]);

  if (fs.existsSync(posterJpg)) {
    const frame = sharp(posterJpg).resize({ width: 1280, withoutEnlargement: true });
    await frame.clone().webp({ quality: 72 }).toFile(poster);
    await frame.clone().avif({ quality: 48, effort: 4 }).toFile(posterAvif);
    fs.unlinkSync(posterJpg);
  }

  const before = fs.statSync(src).size;
  const after = fs.statSync(dest).size;
  console.log(
    `  video: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`
  );
  console.log(`  poster: ${path.basename(poster)}`);
}

await convertImages();
await compressInternshipLogos();
await makeFavicon();
await convertFontsToWoff2();
await compressVideo();
publishLcpAssets();
console.log("Done.");
