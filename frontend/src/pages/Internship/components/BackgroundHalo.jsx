import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BackgroundHalo = ({ color = "#ffffff", opacity = 0.15 }) => {
    const meshRef = useRef();

    const haloMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uOpacity: { value: opacity },
                uTime: { value: 0 },
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
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;

        void main() {
          float dist = length(vUv - vec2(0.5));
          
          // Large soft radial gradient
          float halo = smoothstep(0.5, 0.0, dist);
          halo = pow(halo, 1.5);
          
          // Subtle dreamy pulse
          float pulse = 0.8 + 0.2 * sin(uTime * 0.5);
          
          gl_FragColor = vec4(uColor, halo * uOpacity * pulse);
        }
      `,
        });
    }, [color, opacity]);

    useFrame((state) => {
        if (haloMaterial) {
            haloMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -10]} scale={[40, 40, 1]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={haloMaterial} attach="material" />
        </mesh>
    );
};

export default BackgroundHalo;
