import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

import { companyData } from '../../../data/companies';
import { shouldUseWebGLScene } from '../../../utils/deviceCapability';
import LogoPlane from './LogoPlane';
import GlassStage from './GlassStage';
import GodRayFountain from './GodRayFountain';
import BackgroundHalo from './BackgroundHalo';

/* ================================================================
   CAROUSEL ITEM
   ================================================================ */

const getCarouselDiff = (index, activeIndex, total) => {
  let diff = index - activeIndex;
  if (diff > Math.floor(total / 2)) diff -= total;
  if (diff < -Math.floor(total / 2)) diff += total;
  return diff;
};

const CarouselItem = ({ index, activeIndex, company, onClick, total, timeRef }) => {
  const ref = useRef();
  const prevDiffRef = useRef(null);
  const indexRef = useRef(index);
  const activeIndexRef = useRef(activeIndex);
  const totalRef = useRef(total);
  const tPosRef = useRef(new THREE.Vector3());
  const tScaleRef = useRef(new THREE.Vector3());

  indexRef.current = index;
  activeIndexRef.current = activeIndex;
  totalRef.current = total;

  const diff = getCarouselDiff(index, activeIndex, total);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const frameDiff = getCarouselDiff(indexRef.current, activeIndexRef.current, totalRef.current);

    timeRef.current += delta;
    const time = timeRef.current;

    const t = Math.min(3.5 * delta, 0.16);
    const sp = 2.7;

    const tPos = tPosRef.current;
    const tScale = tScaleRef.current;

    if (frameDiff === 0) {
      tPos.set(0, 0.35, 2);
      tScale.set(1.15, 1.15, 1.15);
    } else if (Math.abs(frameDiff) === 1) {
      const floatX = frameDiff * sp + Math.sin(time * 0.25 + indexRef.current * 1.5) * 0.06;
      const floatY = 0.15 + Math.sin(time * 0.35 + indexRef.current * 2.0) * 0.04;
      const floatRot = frameDiff * -0.25 + Math.sin(time * 0.2 + indexRef.current) * 0.03;
      tPos.set(floatX, floatY, 0);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, floatRot, t);
      tScale.set(0.7, 0.7, 0.7);
    } else if (Math.abs(frameDiff) === 2) {
      const floatX = frameDiff * sp * 0.85 + Math.sin(time * 0.3 + indexRef.current * 1.8) * 0.07;
      const floatY = 0.05 + Math.sin(time * 0.4 + indexRef.current * 2.5) * 0.05;
      const floatRot = frameDiff * -0.19 + Math.sin(time * 0.22 + indexRef.current * 1.2) * 0.04;
      tPos.set(floatX, floatY, -1.5);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, floatRot, t);
      tScale.set(0.5, 0.5, 0.5);
    } else {
      const side = Math.sign(frameDiff) || 1;
      tPos.set(side * 3 * sp * 0.85, 0.05, -1.5);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, side * -0.19, t);
      tScale.set(0, 0, 0);
    }

    const prev = prevDiffRef.current;
    const isWrapping = prev !== null && Math.abs(frameDiff - prev) > Math.floor(totalRef.current / 2);

    if (isWrapping && Math.abs(frameDiff) <= 2) {
      const side = frameDiff > 0 ? 1 : (frameDiff < 0 ? -1 : (prev > 0 ? -1 : 1));
      ref.current.position.set(side * 3.5 * sp, tPos.y, tPos.z);
      ref.current.scale.copy(tScale);
    } else if (isWrapping) {
      ref.current.position.copy(tPos);
      ref.current.scale.copy(tScale);
    } else {
      ref.current.position.lerp(tPos, t);
      if (Math.abs(frameDiff) === 0) {
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, 0, t);
      }
      ref.current.scale.lerp(tScale, t);
    }

    prevDiffRef.current = frameDiff;
  });

  return (
    <group ref={ref} onClick={onClick}>
      <LogoPlane
        svgContent={company.svgString}
        showReflection={diff !== 0}
        isCenter={diff === 0}
        color={company.colors?.[0] || '#ffffff'}
        forceWhiteBack={company.forceWhiteBack}
        forceBlackBack={company.forceBlackBack}
      />

      <mesh position={[0, -4.2, -15]} rotation={[-Math.PI / 2, 0, -7.069]}>
        <circleGeometry args={[2.5, 64]} />
        <shaderMaterial
          key="logo-shadow-v2"
          transparent
          depthWrite={false}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              float dist = length(vUv - vec2(0.5));
              float alpha = smoothstep(0.5, 0.05, dist) * 0.18;
              gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
};

/* ================================================================
   CAROUSEL 3D
   ================================================================ */

const Carousel3D = ({ activeIndex, onLogoClick, displayCompanies }) => {
  const total = displayCompanies.length;
  const timeRef = useRef(0);

  return (
    <group>
      {displayCompanies.map((c, i) => (
        <CarouselItem
          key={i}
          index={i}
          activeIndex={activeIndex}
          company={c}
          onClick={() => onLogoClick(i)}
          total={total}
          timeRef={timeRef}
        />
      ))}
    </group>
  );
};

/* Load HDR environment after the scene is already visible so it cannot
   suspend the whole canvas on first paint. */
const DeferredEnvironment = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <Environment preset="studio" background={false} />
    </Suspense>
  );
};

const StaticLogoCarousel = ({ displayCompanies, activeIndex, onLogoClick }) => {
  const total = displayCompanies.length;
  if (total === 0) return null;

  // Unique neighbors only: active, then ±1, ±2 without duplicates
  const indices = [];
  const seen = new Set();
  const pushUnique = (index) => {
    const normalized = ((index % total) + total) % total;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    indices.push(normalized);
  };
  pushUnique(activeIndex);
  for (let offset = 1; offset <= 2 && indices.length < total; offset++) {
    pushUnique(activeIndex - offset);
    if (indices.length >= total) break;
    pushUnique(activeIndex + offset);
  }

  // Sort visually left→right by circular distance from active
  indices.sort((a, b) => {
    const dist = (i) => {
      let d = i - activeIndex;
      if (d > total / 2) d -= total;
      if (d < -total / 2) d += total;
      return d;
    };
    return dist(a) - dist(b);
  });

  return (
    <ul className="scene-static-carousel" aria-label="Company logos">
      {indices.map((companyIndex) => {
        const company = displayCompanies[companyIndex];
        const isActive = companyIndex === activeIndex;
        const src = company?.svgString;
        if (!src) return null;
        return (
          <li key={companyIndex}>
            <button
              type="button"
              className={`scene-static-logo${isActive ? ' is-active' : ''}`}
              onClick={() => onLogoClick?.(companyIndex)}
              aria-label={company.name}
              aria-current={isActive ? 'true' : undefined}
            >
              <img src={src} alt="" aria-hidden="true" draggable={false} />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

const SceneEffect = ({ activeIndex = 0, onLogoClick, companies = companyData, onReady }) => {
  const [canvasReady, setCanvasReady] = useState(false);
  const [useWebGL, setUseWebGL] = useState(() =>
    typeof window !== 'undefined' && shouldUseWebGLScene()
  );
  const displayCompanies = companies.length > 0 ? companies : companyData;
  const activeCompany = displayCompanies[activeIndex];
  const activeColor = activeCompany?.colors?.[0] || '#ffffff';
  const readyFiredRef = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sync = () => setUseWebGL(shouldUseWebGLScene());
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqHover = window.matchMedia('(hover: none)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    sync();
    mqReduced.addEventListener?.('change', sync);
    mqHover.addEventListener?.('change', sync);
    mqCoarse.addEventListener?.('change', sync);
    mqReduced.addListener?.(sync);
    mqHover.addListener?.(sync);
    mqCoarse.addListener?.(sync);
    return () => {
      mqReduced.removeEventListener?.('change', sync);
      mqHover.removeEventListener?.('change', sync);
      mqCoarse.removeEventListener?.('change', sync);
      mqReduced.removeListener?.(sync);
      mqHover.removeListener?.(sync);
      mqCoarse.removeListener?.(sync);
    };
  }, []);

  useEffect(() => {
    if (!useWebGL) {
      if (!readyFiredRef.current) {
        readyFiredRef.current = true;
        onReadyRef.current?.();
      }
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setCanvasReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [useWebGL]);

  const handleCreated = () => {
    if (readyFiredRef.current) return;
    readyFiredRef.current = true;
    requestAnimationFrame(() => onReadyRef.current?.());
  };

  return (
    <div className="scene-canvas-wrapper">
      {!useWebGL ? (
        <StaticLogoCarousel
          displayCompanies={displayCompanies}
          activeIndex={activeIndex}
          onLogoClick={onLogoClick}
        />
      ) : (
        canvasReady && (
          <Canvas
            camera={{ position: [0, 0.5, 10], fov: 35 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            onCreated={handleCreated}
          >
            <ambientLight intensity={0.65} />
            <directionalLight position={[3, 4, 5]} intensity={0.7} />
            <directionalLight position={[-2, 2, 3]} intensity={0.3} />

            <BackgroundHalo color="#ffffff" opacity={0.12} />
            <Carousel3D
              activeIndex={activeIndex}
              onLogoClick={onLogoClick}
              displayCompanies={displayCompanies}
            />
            <GlassStage />
            <GodRayFountain color={activeColor} />

            <DeferredEnvironment />
          </Canvas>
        )
      )}
    </div>
  );
};

export default SceneEffect;
