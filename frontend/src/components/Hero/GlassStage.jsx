import { useMemo } from 'react';
import * as THREE from 'three';

/* ----------------------------------------------------------------
   ROUNDED-RECTANGLE SHAPE
   Creates a 2D Shape with smooth circular corners, then extruded
   to the desired thickness. 
   ---------------------------------------------------------------- */
function useRoundedRectGeometry(w = 50, d = 50, thickness = 0.06, cornerRadius = 7) {
  return useMemo(() => {
    const hw = w / 2;
    const hd = d / 2;
    const r = Math.min(cornerRadius, hw, hd);

    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hd - r);
    shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hd);
    shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hd + r);
    shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 32,
    });

    geometry.translate(0, 0, -thickness / 2);
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, [w, d, thickness, cornerRadius]);
}

/* ----------------------------------------------------------------
   ALPHA-MAP GENERATOR
   Creates a smooth, deep rear fade for seamless background merging.
   ---------------------------------------------------------------- */
function useAlphaMap(width = 512, height = 512) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, height * 0.1, 0, height);
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
    grad.addColorStop(0.9, 'rgba(0,0,0,0.95)');
    grad.addColorStop(1.0, 'rgba(0,0,0,1.0)');

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [width, height]);
}

/* ----------------------------------------------------------------
   SHADOW MAP GENERATOR
   Creates a soft elliptical shadow beneath the glass stage
   ---------------------------------------------------------------- */
function useShadowMap(width = 512, height = 512) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.75);
    gradient.addColorStop(0.0, 'rgba(0,0,0,0.40)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [width, height]);
}

/* ----------------------------------------------------------------
   GLASS STAGE
   ---------------------------------------------------------------- */
const GlassStage = () => {
  const alphaMap = useAlphaMap();
  const shadowMap = useShadowMap();
  const geometry = useRoundedRectGeometry(50, 50, 0.225, 4); // Refined thickness

  return (
    <group>
      {/* ── Floor Shadows ────────────────────────────────────────── */}
      <group position={[0, -58, -151.5]} rotation={[0, -7.069, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1500, 64]} />
          <meshBasicMaterial map={shadowMap} transparent opacity={0.4} blending={THREE.MultiplyBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* ── White Edge Glow (Focused Halo) ────────────────────────── */}
      <mesh
        position={[0, -4.75, -41.5]}
        rotation={[0., -7.069, 0]}
      >
        <planeGeometry args={[52, 52]} />
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uColor: { value: new THREE.Color("#ffffff") },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform vec3 uColor;
            void main() {
              // Create a 'hollow' rectangular glow that follows the edge
              float edgeX = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x);
              float edgeY = smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
              float outerMask = edgeX * edgeY;
              
              float innerX = smoothstep(0.005, 0.035, vUv.x) * smoothstep(0.995, 0.965, vUv.x);
              float innerY = smoothstep(0.005, 0.035, vUv.y) * smoothstep(0.995, 0.965, vUv.y);
              float innerMask = innerX * innerY;
              
              float glow = outerMask - innerMask;
              gl_FragColor = vec4(uColor, max(0.0, glow) * 0.4);
            }
          `}
        />
      </mesh>

      {/* ── Glass Slab ────────────────────────────────────────────── */}
      <mesh
        geometry={geometry}
        position={[0, -4.75, -41.5]}
        rotation={[0., -7.069, 0]}
      >
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.995}
          ior={1.52}
          thickness={2.8}

          roughness={0.03}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.0}

          transparent
          opacity={1.0}
          alphaMap={alphaMap}

          envMapIntensity={1.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Prismatic Iridescent Glow ─────────────────────────────── */}
      <mesh
        position={[0, -0.65, 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[22, 7]} />
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uColor1: { value: new THREE.Color("#b8c7ff") },
            uColor2: { value: new THREE.Color("#ffb8e7") },
            uColor3: { value: new THREE.Color("#b8ffef") },
            uColor4: { value: new THREE.Color("#fff8b8") },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            void main() {
              vec3 top = mix(uColor1, uColor2, vUv.x);
              vec3 bottom = mix(uColor3, uColor4, vUv.x);
              vec3 color = mix(bottom, top, vUv.y);
              
              float mask = smoothstep(0.0, 0.4, vUv.x) * smoothstep(1.0, 0.6, vUv.x);
              mask *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
              
              gl_FragColor = vec4(color, mask * 0.4);
            }
          `}
        />
      </mesh>
    </group>
  );
};

export default GlassStage;
