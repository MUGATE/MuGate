import { useEffect, useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/**
 * LogoPlane — Extruded 3D logo from SVG texture.
 */

const EXTRUDE_DEPTH = 0.4;
const LAYER_COUNT = 10;

const logoTextureCache = new Map();

const getCacheKey = (svgContent, forceWhiteBack, forceBlackBack) => {
  const content = typeof svgContent === 'string' ? svgContent : String(svgContent ?? '');
  return `${content}|${forceWhiteBack ? 1 : 0}|${forceBlackBack ? 1 : 0}`;
};

const loadLogoTextures = (svgContent, forceWhiteBack, forceBlackBack) => {
  const cacheKey = getCacheKey(svgContent, forceWhiteBack, forceBlackBack);
  const cached = logoTextureCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const content = typeof svgContent === 'string' ? svgContent : String(svgContent);
    const isSvgString = content.trim().startsWith('<svg');
    const imageSrc = isSvgString
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`
      : content;

    const img = new Image();

    img.onload = () => {
      const w = img.naturalWidth || SIZE;
      const h = img.naturalHeight || SIZE;

      let drawW;
      let drawH;
      const MAX_BOUND = SIZE * 0.65;

      if (w > h) {
        drawW = MAX_BOUND;
        drawH = (h / w) * drawW;
      } else {
        drawH = MAX_BOUND;
        drawW = (w / h) * drawH;
      }

      const dx = (SIZE - drawW) / 2;
      const dy = (SIZE - drawH) / 2;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, dx, dy, drawW, drawH);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;

      let silhouetteTexture = null;
      if (forceWhiteBack || forceBlackBack) {
        const silCanvas = document.createElement('canvas');
        silCanvas.width = SIZE;
        silCanvas.height = SIZE;
        const sCtx = silCanvas.getContext('2d');
        sCtx.drawImage(img, dx, dy, drawW, drawH);
        sCtx.globalCompositeOperation = 'source-in';
        sCtx.fillStyle = forceBlackBack ? '#000000' : '#ffffff';
        sCtx.fillRect(0, 0, SIZE, SIZE);

        silhouetteTexture = new THREE.CanvasTexture(silCanvas);
        silhouetteTexture.needsUpdate = true;
        silhouetteTexture.colorSpace = THREE.SRGBColorSpace;
      }

      const result = { texture, silhouetteTexture };
      logoTextureCache.set(cacheKey, result);
      resolve(result);
    };

    img.onerror = () => reject(new Error(`[LogoPlane] failed to load: ${imageSrc}`));
    img.src = imageSrc;
  });
};

const LogoPlane = ({
  svgContent,
  floorY = -1.4,
  debug = false,
  showReflection = true,
  isCenter = false,
  forceWhiteBack = false,
  forceBlackBack = false,
}) => {
  const initialCache = logoTextureCache.get(getCacheKey(svgContent, forceWhiteBack, forceBlackBack));
  const [texture, setTexture] = useState(() => initialCache?.texture ?? null);
  const [silhouetteTexture, setSilhouetteTexture] = useState(() => initialCache?.silhouetteTexture ?? null);
  const groupRef = useRef();
  const reflectionRef = useRef();

  const sweepMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.4 },
        uTexture: { value: null },
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

          float cycle = 5.0;
          float t = mod(uTime, cycle);
          float progress = clamp(t / 2.0, 0.0, 1.0);
          float pos = mix(-1.5, 1.5, progress);
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
    if (svgContent == null || svgContent === '') return undefined;

    let cancelled = false;
    const cacheKey = getCacheKey(svgContent, forceWhiteBack, forceBlackBack);
    const cached = logoTextureCache.get(cacheKey);

    if (cached) {
      setTexture(cached.texture);
      setSilhouetteTexture(cached.silhouetteTexture ?? null);
      return undefined;
    }

    loadLogoTextures(svgContent, forceWhiteBack, forceBlackBack)
      .then((result) => {
        if (cancelled) return;
        setTexture(result.texture);
        setSilhouetteTexture(result.silhouetteTexture ?? null);
      })
      .catch((err) => {
        if (!cancelled) console.warn(err.message || err);
      });

    return () => {
      cancelled = true;
    };
  }, [svgContent, forceWhiteBack, forceBlackBack]);

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

  const layerColors = useMemo(
    () =>
      Array.from({ length: LAYER_COUNT }, (_, i) => {
        const t = i / (LAYER_COUNT - 1);
        const brightness = -0.4 - t * 0.15;
        return new THREE.Color(brightness, brightness, brightness);
      }),
    []
  );

  const backColor = useMemo(() => new THREE.Color(0.65, 0.65, 0.65), []);
  const planeArgs = useMemo(() => [1.8, 1.8], []);

  const reflectionMaterial = useMemo(() => {
    if (!texture) return null;
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        tDiffuse: { value: texture },
        opacity: { value: 0.5 },
        debug: { value: debug ? 1.0 : 0.0 },
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
      <group rotation={[-0.16, -0.16, 0]}>
        {isCenter && (
          <group position={[0, 0, 0.05]} renderOrder={LAYER_COUNT + 5}>
            <mesh>
              <planeGeometry args={planeArgs} />
              <primitive object={sweepMaterial} attach="material" />
            </mesh>
            <Sparkles
              count={60}
              scale={3.0}
              size={2.5}
              speed={0.4}
              opacity={0.9}
              color="#ffffff"
            />
          </group>
        )}

        <mesh renderOrder={LAYER_COUNT + 2}>
          <planeGeometry args={planeArgs} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.15}
            side={THREE.FrontSide}
          />
        </mesh>

        {isCenter && (
          <mesh position={[0, 0, 0.03]} renderOrder={LAYER_COUNT + 4}>
            <planeGeometry args={planeArgs} />
            <shaderMaterial
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              uniforms={{ uTexture: { value: texture } }}
              vertexShader={`
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                varying vec2 vUv;
                uniform sampler2D uTexture;
                void main() {
                  float logoAlpha = texture2D(uTexture, vUv).a;
                  if (logoAlpha < 0.1) discard;
                  float upFade = 1.0 - smoothstep(0.0, 0.35, vUv.y);
                  gl_FragColor = vec4(1.0, 1.0, 1.0, upFade * logoAlpha * 0.25);
                }
              `}
            />
          </mesh>
        )}

        {layerColors.map((color, i) => (
          <mesh
            key={i}
            position={[0, 0, -(i + 1) * (EXTRUDE_DEPTH / LAYER_COUNT)]}
            renderOrder={LAYER_COUNT - i}
          >
            <planeGeometry args={planeArgs} />
            <meshBasicMaterial
              map={(forceWhiteBack || forceBlackBack) && silhouetteTexture ? silhouetteTexture : texture}
              transparent
              alphaTest={0.15}
              side={THREE.DoubleSide}
              color={color}
            />
          </mesh>
        ))}

        <mesh
          position={[0, 0, -EXTRUDE_DEPTH]}
          rotation={[0, Math.PI, 0]}
          renderOrder={0}
        >
          <planeGeometry args={planeArgs} />
          <meshBasicMaterial
            map={(forceWhiteBack || forceBlackBack) && silhouetteTexture ? silhouetteTexture : texture}
            transparent
            alphaTest={0.15}
            side={THREE.FrontSide}
            color={backColor}
          />
        </mesh>
      </group>

      {showReflection && reflectionMaterial && (
        <mesh ref={reflectionRef}>
          <planeGeometry args={planeArgs} />
          <primitive object={reflectionMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
};

export default LogoPlane;
