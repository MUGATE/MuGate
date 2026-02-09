import { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

/**
 * LogoPlane — Extruded 3D logo from SVG texture.
 *
 * Pipeline: SVG string → data:URI → Image → Canvas → CanvasTexture
 *           → front face (full color) + stacked depth layers (shaded) + back face
 *
 * Creates a convincing extruded-solid look for any arbitrary SVG logo.
 */

const EXTRUDE_DEPTH = 0.4;   // total extrusion depth
const LAYER_COUNT = 10;        // slices for smooth side appearance

const LogoPlane = ({ svgContent }) => {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!svgContent) return;
    let cancelled = false;

    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth  || SIZE;
      const h = img.naturalHeight || SIZE;
      const scale = Math.min(SIZE / w, SIZE / h) * 0.82;
      const dx = (SIZE - w * scale) / 2;
      const dy = (SIZE - h * scale) / 2;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, dx, dy, w * scale, h * scale);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    };

    img.onerror = () => {
      if (!cancelled) console.warn('[LogoPlane] SVG failed to load');
    };

    img.src = dataUri;
    return () => { cancelled = true; };
  }, [svgContent]);

  // Pre-compute layer colors — keep bright to avoid dark outlines
  const layerColors = useMemo(() =>
    Array.from({ length: LAYER_COUNT }, (_, i) => {
      const t = i / (LAYER_COUNT - 1);          // 0 = closest to front, 1 = deepest
      const brightness = -0.4 - t * 0.15;       // subtle shading, never dark
      return new THREE.Color(brightness, brightness, brightness);
    }),
  []);

  const backColor = useMemo(() => new THREE.Color(0.65, 0.65, 0.65), []);
  const planeArgs = useMemo(() => [1.8, 1.8], []);

  if (!texture) return null;

  return (
    <group rotation={[-0.16, -0.16, 0]}>
      {/* ── Front face — unlit, no reflections ─────────────────── */}
      <mesh renderOrder={LAYER_COUNT + 2}>
        <planeGeometry args={planeArgs} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.15}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* ── Depth layers — stacked behind front, progressively darker */}
      {layerColors.map((color, i) => (
        <mesh
          key={i}
          position={[0, 0, -(i + 1) * (EXTRUDE_DEPTH / LAYER_COUNT)]}
          renderOrder={LAYER_COUNT - i}
        >
          <planeGeometry args={planeArgs} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.15}
            side={THREE.DoubleSide}
            color={color}
          />
        </mesh>
      ))}

      {/* ── Back face — darkened, facing backward ────────────────── */}
      <mesh
        position={[0, 0, -EXTRUDE_DEPTH]}
        rotation={[0, Math.PI, 0]}
        renderOrder={0}
      >
        <planeGeometry args={planeArgs} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.15}
          side={THREE.FrontSide}
          color={backColor}
        />
      </mesh>
    </group>
  );
};

export default LogoPlane;
