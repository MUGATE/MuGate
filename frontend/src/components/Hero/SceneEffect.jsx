import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { companyData } from '../../data/companies';
import LogoPlane from './LogoPlane';
import GlassStage from './GlassStage';

/* ================================================================
   CAROUSEL ITEM
   ================================================================ */
const CarouselItem = ({ index, activeIndex, company, onClick, total, timeRef }) => {
  const ref = useRef();

  let diff = index - activeIndex;
  if (diff > Math.floor(total / 2))  diff -= total;
  if (diff < -Math.floor(total / 2)) diff += total;

  useFrame((_, delta) => {
    if (!ref.current) return;
    
    // Update shared time
    timeRef.current += delta;
    const time = timeRef.current;
    
    const t = Math.min(3.5 * delta, 0.16);
    const sp = 2.7;

    let tPos, tRot, tScale;

    if (diff === 0) {
      // Active logo - slower floating motion
      const floatX = Math.sin(time * 0.4) * 0.08;
      const floatY = Math.sin(time * 0.6) * 0.03 + 0.35;
      tPos = new THREE.Vector3(floatX, floatY, 2);
      tRot = new THREE.Euler(0, Math.sin(time * 0.3) * 0.03, 0);
      tScale = new THREE.Vector3(1.15, 1.15, 1.15);
    } else if (Math.abs(diff) === 1) {
      // Adjacent logos - stable horizontal position, no drift
      tPos = new THREE.Vector3(diff * sp, 0.15, -0);
      tRot = new THREE.Euler(0, diff * -0.25, 0);
      tScale = new THREE.Vector3(0.7, 0.7, 0.7);
    } else if (Math.abs(diff) === 2) {
      // Further logos - stable horizontal position, no drift
      tPos = new THREE.Vector3(diff * sp * 0.85, 0.05, -1.5);
      tRot = new THREE.Euler(0, diff * -0.19, 0);
      tScale = new THREE.Vector3(0.5, 0.5, 0.5);
    } else {
      // Distant logos - no motion
      tPos = new THREE.Vector3(diff * sp * 1.5, 0, -6);
      tRot = new THREE.Euler(0, 0, 0);
      tScale = new THREE.Vector3(0, 0, 0);
    }

    ref.current.position.lerp(tPos, t);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, tRot.y, t);
    ref.current.scale.lerp(tScale, t);
  });

  return (
    <group ref={ref} onClick={onClick}>
      {/* Main Logo */}
      <LogoPlane svgContent={company.svgString} />
      
      {/* Shadow - radial gradient for realistic soft shadow */}
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
const Carousel3D = ({ activeIndex, onLogoClick }) => {
  const total = companyData.length;
  const timeRef = useRef(0);
  
  return (
    <group>
      {companyData.map((c, i) => (
        <CarouselItem
          key={c.id} index={i}
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
const SceneEffect = ({ activeIndex = 0, onLogoClick }) => (
  <div className="scene-canvas-wrapper">
    <Canvas
      camera={{ position: [0, 0.5, 10], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Soft ambient + directional for 3D logo depth */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={0.6} />
      <directionalLight position={[-2, 2, 3]} intensity={0.25} />

      {/* HDRI for transmission to render */}
      <Environment preset="studio" background={false} />

      <Carousel3D activeIndex={activeIndex} onLogoClick={onLogoClick} />
      <GlassStage />
    </Canvas>
  </div>
);

export default SceneEffect;
