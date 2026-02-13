import { useMemo } from 'react';
import * as THREE from 'three';

const VolumetricBeam = ({
    position = [0, 8.0, 2.5],
    color = "#ffffff",
    opacity = 0.45,
    radiusTop = 0.05,
    radiusBottom = 1.8
}) => {
    // Calculated to stop exactly at floor (floor is at -4.75)
    // Source is at position[1]=8.0. Target is -4.75.
    // Total height = 12.75
    // Mesh Y = (8.0 + -4.75) / 2 = 1.625. Relative to group position [0, 8.0, 2.5],
    // mesh local Y = 1.625 - 8.0 = -6.375.

    const BEAM_HEIGHT = 12.75;
    const MESH_Y = -6.375;
    const FLOOR_Y = -12.75; // 8.0 - 12.75 = -4.75

    const beamMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
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
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          // Vertical fade: source at top (vUv.y=1)
          float verticalFade = smoothstep(0.0, 1.0, vUv.y);
          
          // Radial fade: focused cone
          float radialFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
          radialFade = pow(radialFade, 2.0);

          // Edge softness (stops sharply at bottom)
          float edgeSoftness = smoothstep(1.0, 0.95, vUv.y);

          float finalAlpha = verticalFade * radialFade * uOpacity * edgeSoftness;
          
          gl_FragColor = vec4(uColor, finalAlpha);
        }
      `,
            side: THREE.DoubleSide,
        });
    }, [opacity]);

    const spotLightMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                uColor: { value: new THREE.Color("#ffffff") },
                uOpacity: { value: opacity * 0.8 }, // Lowered opacity significantly
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

        void main() {
          float dist = length(vUv - vec2(0.5));
          
          // Sharp circular edge to "stand out"
          float rim = smoothstep(0.5, 0.48, dist);
          float core = smoothstep(0.48, 0.0, dist) * 0.7;
          
          gl_FragColor = vec4(uColor, (rim + core) * uOpacity);
        }
      `,
        });
    }, [opacity]);

    return (
        <group position={position}>
            {/* Volumetric Cone Beam - STOPS AT FLOOR */}
            <mesh position={[0, MESH_Y, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, BEAM_HEIGHT, 64, 1, true]} />
                <primitive object={beamMaterial} attach="material" />
            </mesh>

            {/* Spotlight on the floor - EXACTLY AT FLOOR LEVEL */}
            <mesh position={[0, FLOOR_Y, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[radiusBottom * 2.0, radiusBottom * 2.0]} />
                <primitive object={spotLightMaterial} attach="material" />
            </mesh>
        </group>
    );
};

export default VolumetricBeam;
