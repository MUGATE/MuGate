import { useEffect, useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/**
 * LogoPlane — Extruded 3D logo from SVG texture.
 */

const EXTRUDE_DEPTH = 0.4;
const LAYER_COUNT = 10;

const LogoPlane = ({ svgContent, floorY = -1.4, debug = false, showReflection = true, isCenter = false }) => {
  const [texture, setTexture] = useState(null);
  const groupRef = useRef();
  const reflectionRef = useRef();

  // ── Premium Alpha-Masked Sweep Shine ───────────────────────
  const sweepMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.4 },
        uTexture: { value: null }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uOpacity;
        uniform sampler2D uTexture;

        void main() {
          vec4 texColor = texture2D(uTexture, vUv);
          if (texColor.a < 0.01) discard;

          // 5 second total cycle: 2s sweep, 3s pause
          float cycle = 5.0;
          float t = mod(uTime, cycle);
          float progress = clamp(t / 2.0, 0.0, 1.0);
          
          // Diagonal position for y - x (range is -1 to 1)
          float pos = mix(-1.5, 1.5, progress);
          
          // Narrow high-end band using y - x for "down right to top left"
          float band = smoothstep(pos - 0.2, pos, vUv.y - vUv.x) * 
                       smoothstep(pos + 0.2, pos, vUv.y - vUv.x);
          
          float visibility = progress < 1.0 ? 1.0 : 0.0;
          
          float alpha = band * uOpacity * texColor.a * visibility;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
    });
  }, []);

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

  useFrame((state) => {
    if (groupRef.current && reflectionRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      reflectionRef.current.position.y = (floorY - 0.6) - worldPos.y;
    }
    if (sweepMaterial && texture) {
      sweepMaterial.uniforms.uTime.value = state.clock.elapsedTime;
      sweepMaterial.uniforms.uTexture.value = texture;
    }
  });

  // Pre-compute layer colors
  const layerColors = useMemo(() =>
    Array.from({ length: LAYER_COUNT }, (_, i) => {
      const t = i / (LAYER_COUNT - 1);
      const brightness = -0.4 - t * 0.15;
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
          vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
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
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(color.rgb, vec3(gray), 0.1);
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
        {/* Subtle white shine & sparkles */}
        {isCenter && (
          <group position={[0, 0, 0.05]} renderOrder={LAYER_COUNT + 5}>
            {/* White sweep shine */}
            <mesh>
              <planeGeometry args={planeArgs} />
              <primitive object={sweepMaterial} attach="material" />
            </mesh>

            {/* White Animated Sparkles */}
            <Sparkles
              count={60}
              scale={3.0}
              size={2.5}
              speed={0.4}
              opacity={0.9}
              color={"#ffffff"}
            />
          </group>
        )}

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
