import { useMemo } from 'react';
import * as THREE from 'three';

/* ----------------------------------------------------------------
   ROUNDED-RECTANGLE SHAPE
   Creates a 2D Shape with smooth circular corners, then extruded
   to the desired thickness. This bypasses RoundedBox's radius cap
   (which limits to half the smallest dimension).
   ---------------------------------------------------------------- */
function useRoundedRectGeometry(w = 50, d = 50, thickness = 0.06, cornerRadius = 7) {
  return useMemo(() => {
    const hw = w / 2;
    const hd = d / 2;
    const r = Math.min(cornerRadius, hw, hd); // clamp to half-size

    const shape = new THREE.Shape();
    // Start bottom-left, going clockwise
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);       // bottom-right corner
    shape.lineTo(hw, hd - r);
    shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);         // top-right corner
    shape.lineTo(-hw + r, hd);
    shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);  // top-left corner
    shape.lineTo(-hw, -hd + r);
    shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false); // bottom-left corner

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 32, // smooth circular arcs
    });

    // Center the extrusion on Y (so the slab sits centered on its position)
    geometry.translate(0, 0, -thickness / 2);
    // Rotate so the extruded depth runs along Y-axis (up), not Z
    geometry.rotateX(-Math.PI / 2);

    geometry.computeVertexNormals();
    return geometry;
  }, [w, d, thickness, cornerRadius]);
}

/* ----------------------------------------------------------------
   ALPHA-MAP GENERATOR
   Creates a fade from front (opaque) to back (transparent)
   ---------------------------------------------------------------- */
function useAlphaMap(width = 256, height = 256) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0.0, 'rgba(255,255,255,1.0)');   // front edge fully visible
    grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');   // back edge fades out

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [width, height]);
}

/* ----------------------------------------------------------------
   GLASS STAGE — smooth circular corners via ExtrudeGeometry
   ---------------------------------------------------------------- */
const GlassStage = () => {
  const alphaMap = useAlphaMap();
  const geometry = useRoundedRectGeometry(50, 50, 0.14, 3); // 3-unit corner radius, thicker slab

  return (
    <group>
      {/* ── Glass Slab ────────────────────────────────────────────── */}
      <mesh
        geometry={geometry}
        position={[0, -4.75, -41.5]}
        rotation={[0., -7.069, 0]}    // Front edge raised, back edge lowered — more level
      >
        <meshPhysicalMaterial
          color="#d8e8ff"
          attenuationColor="#c0d8ff"
          attenuationDistance={2.0}

          transmission={0.88}
          ior={1.52}
          thickness={0.8}

          roughness={0.24}
          metalness={0.0}
          clearcoat={0.8}
          clearcoatRoughness={0.15}

          transparent
          opacity={0.90}
          alphaMap={alphaMap}

          envMapIntensity={1.0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Caustic Glow ──────────────────────────────────────────── */}
      <mesh
        position={[0, -0.85, 0.7]}         // Just beneath slab
        rotation={[-Math.PI / 2, 0, 0]}    // Flat on the ground plane
      >
        <planeGeometry args={[9, 3]} />
        <meshBasicMaterial
          color="#d0e4ff"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default GlassStage;
