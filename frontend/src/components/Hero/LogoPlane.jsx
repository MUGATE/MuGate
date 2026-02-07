import { useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * LogoPlane  Renders an SVG string as a textured 3D plane.
 *
 * Pipeline: SVG string -> data:URI -> Image -> Canvas -> CanvasTexture -> planeGeometry
 *
 * - PlaneGeometry [1.8, 1.8]
 * - meshBasicMaterial (unlit, natural SVG colors)
 * - NO emissive, NO toneMapped=false, NO color grading
 */
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

  if (!texture) return null;

  return (
    <mesh>
      <planeGeometry args={[1.8, 1.8]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.01}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default LogoPlane;
