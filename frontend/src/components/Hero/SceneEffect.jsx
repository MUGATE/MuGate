import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { companyData } from '../../data/companies';
import LogoPlane from './LogoPlane';
import GlassStage from './GlassStage';

/* ================================================================
   CAROUSEL ITEM
   ================================================================ */
const CarouselItem = ({ index, activeIndex, company, onClick, total }) => {
  const ref = useRef();

  let diff = index - activeIndex;
  if (diff > Math.floor(total / 2))  diff -= total;
  if (diff < -Math.floor(total / 2)) diff += total;

  useFrame((_, delta) => {
    if (!ref.current) return;
    const t = Math.min(3.5 * delta, 0.16);
    const sp = 2.7;

    let tPos, tRot, tScale;

    if (diff === 0) {
      tPos   = new THREE.Vector3(0, 0.35, 2);
      tRot   = new THREE.Euler(0, 0, 0);
      tScale = new THREE.Vector3(1.15, 1.15, 1.15);
    } else if (Math.abs(diff) === 1) {
      tPos   = new THREE.Vector3(diff * sp, 0.15, 0);
      tRot   = new THREE.Euler(0, diff * -0.06, 0);
      tScale = new THREE.Vector3(0.7, 0.7, 0.7);
    } else if (Math.abs(diff) === 2) {
      tPos   = new THREE.Vector3(diff * sp * 0.85, 0.05, -1.5);
      tRot   = new THREE.Euler(0, diff * -0.12, 0);
      tScale = new THREE.Vector3(0.5, 0.5, 0.5);
    } else {
      tPos   = new THREE.Vector3(diff * sp * 1.5, 0, -6);
      tRot   = new THREE.Euler(0, 0, 0);
      tScale = new THREE.Vector3(0, 0, 0);
    }

    ref.current.position.lerp(tPos, t);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, tRot.y, t);
    ref.current.scale.lerp(tScale, t);
  });

  return (
    <group ref={ref} onClick={onClick}>
      <LogoPlane svgContent={company.svgString} />
    </group>
  );
};

/* ================================================================
   CAROUSEL 3D
   ================================================================ */
const Carousel3D = ({ activeIndex, onLogoClick }) => {
  const total = companyData.length;
  return (
    <group>
      {companyData.map((c, i) => (
        <CarouselItem
          key={c.id} index={i}
          activeIndex={activeIndex}
          company={c}
          onClick={() => onLogoClick(i)}
          total={total}
        />
      ))}
    </group>
  );
};

/* ================================================================
   SCENE EFFECT — Baseline R3F Canvas
   ================================================================
   - PerspectiveCamera: [0, 0.5, 10] fov 35
   - One ambientLight: 0.4
   - Background: #f0f2f5 (flat solid)
   - No postprocessing, no effects, no environment maps
   ================================================================ */
const SceneEffect = ({ activeIndex = 0, onLogoClick }) => (
  <div className="scene-canvas-wrapper">
    <Canvas
      camera={{ position: [0, 0.5, 10], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Soft ambient only — no directional light on glass */}
      <ambientLight intensity={0.4} />

      {/* HDRI for transmission to render */}
      <Environment preset="studio" background={false} />

      <Carousel3D activeIndex={activeIndex} onLogoClick={onLogoClick} />
      <GlassStage />
    </Canvas>
  </div>
);

export default SceneEffect;
