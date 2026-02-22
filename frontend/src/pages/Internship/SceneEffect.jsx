import { useRef, useState, useMemo, useEffect } from 'react';

import { Canvas, useFrame } from '@react-three/fiber';

import { Environment } from '@react-three/drei';

import * as THREE from 'three';

import { companyData } from '../../data/companies';

import LogoPlane from './LogoPlane';

import GlassStage from './GlassStage';
import GodRayFountain from './GodRayFountain';
import BackgroundHalo from './BackgroundHalo';



/* ================================================================

   CAROUSEL ITEM

   ================================================================ */

const CarouselItem = ({ index, activeIndex, company, onClick, total, timeRef }) => {

  const ref = useRef();



  let diff = index - activeIndex;

  if (diff > Math.floor(total / 2)) diff -= total;

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

      // Active logo - at rest, no motion

      tPos = new THREE.Vector3(0, 0.35, 2);

      tRot = new THREE.Euler(0, 0, 0);

      tScale = new THREE.Vector3(1.15, 1.15, 1.15);

    } else if (Math.abs(diff) === 1) {

      // Adjacent logos - gentle floating motion

      const floatX = diff * sp + Math.sin(time * 0.25 + index * 1.5) * 0.06;

      const floatY = 0.15 + Math.sin(time * 0.35 + index * 2.0) * 0.04;

      const floatRot = diff * -0.25 + Math.sin(time * 0.2 + index) * 0.03;

      tPos = new THREE.Vector3(floatX, floatY, -0);

      tRot = new THREE.Euler(0, floatRot, 0);

      tScale = new THREE.Vector3(0.7, 0.7, 0.7);

    } else if (Math.abs(diff) === 2) {

      // Further logos - gentle floating motion

      const floatX = diff * sp * 0.85 + Math.sin(time * 0.3 + index * 1.8) * 0.07;

      const floatY = 0.05 + Math.sin(time * 0.4 + index * 2.5) * 0.05;

      const floatRot = diff * -0.19 + Math.sin(time * 0.22 + index * 1.2) * 0.04;

      tPos = new THREE.Vector3(floatX, floatY, -1.5);

      tRot = new THREE.Euler(0, floatRot, 0);

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

      <LogoPlane
        svgContent={company.svgString}
        showReflection={diff !== 0}
        isCenter={diff === 0}
        color={company.colors?.[0] || "#ffffff"}
        forceWhiteBack={company.forceWhiteBack}
      />



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

const SceneEffect = ({ activeIndex = 0, onLogoClick }) => {
  const activeCompany = companyData[activeIndex];
  // Use the first color from the array or fallback to white
  const activeColor = activeCompany?.colors?.[0] || "#ffffff";

  return (
    <div className="scene-canvas-wrapper">
      <Canvas
        camera={{ position: [0, 0.5, 10], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={0.6} />
        <directionalLight position={[-2, 2, 3]} intensity={0.25} />

        <Environment preset="studio" background={false} />

        <BackgroundHalo color="#ffffff" opacity={0.12} />

        <Carousel3D activeIndex={activeIndex} onLogoClick={onLogoClick} />
        <GlassStage />

        <GodRayFountain color={activeColor} />
      </Canvas>
    </div>
  );
};



export default SceneEffect;

