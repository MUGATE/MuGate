import { useEffect, useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

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



const LogoPlane = ({ svgContent, floorY = -1.4, debug = false, showReflection = true }) => {
  const [texture, setTexture] = useState(null);
  const groupRef = useRef();
  const reflectionRef = useRef();


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

      const w = img.naturalWidth || SIZE;

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

  useFrame(() => {
    if (groupRef.current && reflectionRef.current) {
      // Get the world Y of the logo group
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);

      // Calculate local Y for the reflection to stay at floorY
      // Local Y = floorY - 0.6 - worldY
      // If billboard is vertical (1.8 height), and we want its top at floorY,
      // its center should be at floorY - 0.9.
      reflectionRef.current.position.y = (floorY - 0.6) - worldPos.y;
    }
  });

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

  // ── Reflection Shader Material ───────────────────────────────
  const reflectionMaterial = useMemo(() => {
    if (!texture) return null;
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        tDiffuse: { value: texture },
        opacity: { value: 0.5 },
        debug: { value: debug ? 1.0 : 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float opacity;
        uniform float debug;
        varying vec2 vUv;

        void main() {
          // Vertical flip
          vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
          
          // Stronger blur (gaussian-like 9-tap spread)
          float off = 6.0 / 512.0;
          vec4 color = texture2D(tDiffuse, flippedUv) * 0.22;
          color += texture2D(tDiffuse, flippedUv + vec2(off, 0.0)) * 0.12;
          color += texture2D(tDiffuse, flippedUv + vec2(-off, 0.0)) * 0.12;
          color += texture2D(tDiffuse, flippedUv + vec2(0.0, off)) * 0.12;
          color += texture2D(tDiffuse, flippedUv + vec2(0.0, -off)) * 0.12;
          color += texture2D(tDiffuse, flippedUv + vec2(off, off)) * 0.075;
          color += texture2D(tDiffuse, flippedUv + vec2(-off, off)) * 0.075;
          color += texture2D(tDiffuse, flippedUv + vec2(off, -off)) * 0.075;
          color += texture2D(tDiffuse, flippedUv + vec2(-off, -off)) * 0.075;

          if (color.a < 0.01) discard;

          // Desaturation (10%)
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(color.rgb, vec3(gray), 0.1);

          // Smooth gradient fade: only the top 25% from the floor boundary is visible
          // vUv.y=1 is the contact point with the floor
          float fade = smoothstep(0.3, 1.5, vUv.y);
          color.a *= fade * opacity;

          if (debug > 0.5) {
            color.rgb = mix(color.rgb, vec3(1.0, 0.0, 1.0), 0.4);
            color.a = mix(color.a, 0.5, 0.5);
          }

          gl_FragColor = color;
        }
      `,
    });
  }, [texture, debug]);

  if (!texture) return null;

  return (
    <group ref={groupRef}>
      {/* ── Main Logo Group (Tilted) ───────────────────────────── */}
      <group rotation={[-0.16, -0.16, 0]}>
        {/* Front face */}
        <mesh renderOrder={LAYER_COUNT + 2}>
          <planeGeometry args={planeArgs} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.15}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Depth layers */}
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

        {/* Back face */}
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

      {/* ── Glass Reflection (Vertical Billboard) ──────────────────── */}
      {showReflection && reflectionMaterial && (
        <mesh
          ref={reflectionRef}
        >
          <planeGeometry args={planeArgs} />
          <primitive object={reflectionMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
};

export default LogoPlane;
