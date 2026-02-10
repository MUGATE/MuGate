import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const GodRayFountain = ({ color = "#ffffff", opacity = 0.6 }) => {
    const meshRef = useRef();

    const fountainMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color("#ffffff") },
                uOpacity: { value: opacity },
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
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          // Rhythmic Beacon Pulse - Higher base for better visibility
          float pulse = 0.8 + 0.2 * sin(uTime * 2.5);
          
          // Pure white core
          vec3 finalColor = uColor;
          
          // Upward fade stays stable
          float verticalFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
          
          // Sharper Core Beam
          float dist = abs(vUv.x - 0.5) * 2.0;
          float beam = pow(1.0 - dist, 3.5);
          
          // Subtle vertical shimmer
          float shimmer = 0.9 + 0.1 * sin(vUv.y * 12.0 - uTime * 5.0);
          
          float finalAlpha = beam * verticalFade * uOpacity * pulse * shimmer * 1.5; // Boosted
          
          gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
        }
      `,
            side: THREE.DoubleSide,
        });
    }, [color, opacity]);

    useFrame((state) => {
        if (fountainMaterial) {
            fountainMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <group position={[0, -0.65, 0.8]}>
            {/* The main beacon light beam - Significant Presence */}
            <mesh ref={meshRef} position={[0, 4.5, 0]} renderOrder={10}>
                <cylinderGeometry args={[4.5, 0.8, 9, 32, 1, true]} />
                <primitive object={fountainMaterial} attach="material" />
            </mesh>

            {/* Upward rising particles - expanded field */}
            <Sparkles
                count={120}
                scale={[4.5, 10, 4.5]}
                size={4}
                speed={0.6}
                opacity={1}
                position={[0, 4.5, 0]}
                color="#ffffff"
            />

            {/* ── Stable Beacon Core ── */}
            <group position={[0, 0.05, 0]}>
                {/* Main white core - MASSIVE RADIANCE */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={11}>
                    <circleGeometry args={[2.5, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>

                {/* Inner brilliant core glow (Environment Harmony) */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={12}>
                    <circleGeometry args={[1.5, 32]} />
                    <meshBasicMaterial color="#d6e4f2" transparent opacity={1.0} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            </group>
        </group>
    );
};

export default GodRayFountain;
