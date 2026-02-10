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

   Creates triangular fade with background color blending and blur

   for seamless environmental integration

   ---------------------------------------------------------------- */

function useAlphaMap(width = 512, height = 512) {

  return useMemo(() => {

    const canvas = document.createElement('canvas');

    canvas.width = width;

    canvas.height = height;

    const ctx = canvas.getContext('2d');



    // Start with full opacity everywhere

    ctx.fillStyle = 'rgba(255,255,255,1.0)';

    ctx.fillRect(0, 0, width, height);



    // Create triangular disappearance region with background blending

    ctx.globalCompositeOperation = 'destination-out';

    

    // Define triangle path - apex at back center, base extends beyond corners

    ctx.beginPath();

    ctx.moveTo(width * 0.5, height * 0.35);           // triangle apex (earlier start)

    ctx.lineTo(-width * 0.1, height);                // beyond back-left corner

    ctx.lineTo(width * 1.1, height);                 // beyond back-right corner

    ctx.closePath();



    // Create gradient within triangle for complete removal

    const triangleGrad = ctx.createLinearGradient(

      width * 0.5, height * 0.35,    // apex

      width * 0.5, height           // base

    );

    triangleGrad.addColorStop(0.0, 'rgba(255,255,255,0.1)');     // apex - start removal

    triangleGrad.addColorStop(0.2, 'rgba(255,255,255,0.4)');     // moderate removal

    triangleGrad.addColorStop(0.4, 'rgba(255,255,255,0.8)');     // heavy removal

    triangleGrad.addColorStop(0.6, 'rgba(255,255,255,0.95)');    // almost complete

    triangleGrad.addColorStop(0.8, 'rgba(255,255,255,1.0)');     // completely gone

    triangleGrad.addColorStop(1.0, 'rgba(255,255,255,1.0)');     // stay gone



    ctx.fillStyle = triangleGrad;

    ctx.fill();



    // Apply blur to soften edges

    ctx.filter = 'blur(3px)';

    ctx.globalCompositeOperation = 'destination-out';

    ctx.fill();

    ctx.filter = 'none';



    // Reset and add background color blending

    ctx.globalCompositeOperation = 'source-over';

    

    // Background color blend layer (#f0f2f5)

    const bgBlend = ctx.createLinearGradient(0, height * 0.4, 0, height);

    bgBlend.addColorStop(0.0, 'rgba(240,242,245,0.0)');    // no blend at front

    bgBlend.addColorStop(0.4, 'rgba(240,242,245,0.1)');    // start blending

    bgBlend.addColorStop(0.65, 'rgba(240,242,245,0.25)');   // moderate blend

    bgBlend.addColorStop(0.85, 'rgba(240,242,245,0.45)');   // strong blend

    bgBlend.addColorStop(1.0, 'rgba(240,242,245,0.7)');     // full background merge



    ctx.globalCompositeOperation = 'multiply';

    ctx.fillStyle = bgBlend;

    ctx.fillRect(0, 0, width, height);



    // Add subtle atmospheric blur to the entire rear section

    ctx.filter = 'blur(1px)';

    ctx.globalCompositeOperation = 'source-over';

    const rearBlur = ctx.createLinearGradient(0, height * 0.5, 0, height);

    rearBlur.addColorStop(0.0, 'rgba(240,242,245,0.0)');    // no blur at front

    rearBlur.addColorStop(0.7, 'rgba(240,242,245,0.05)');    // subtle blur

    rearBlur.addColorStop(1.0, 'rgba(240,242,245,0.15)');    // atmospheric blur



    ctx.fillStyle = rearBlur;

    ctx.fillRect(0, 0, width, height);

    ctx.filter = 'none';



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



    // Clear canvas (fully transparent)

    ctx.clearRect(0, 0, width, height);



    // Soft radial gradient for natural shadow falloff

    const cx = width / 2;

    const cy = height / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.75);

    gradient.addColorStop(0.0, 'rgba(0,0,0,0.45)');

    gradient.addColorStop(0.3, 'rgba(0,0,0,0.30)');

    gradient.addColorStop(0.6, 'rgba(0,0,0,0.15)');

    gradient.addColorStop(0.85, 'rgba(0,0,0,0.04)');

    gradient.addColorStop(1.0, 'rgba(0,0,0,0.0)');



    ctx.fillStyle = gradient;

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

  const shadowMap = useShadowMap();

  const geometry = useRoundedRectGeometry(50, 50, 0.14, 3); // 3-unit corner radius, thicker slab



  return (

    <group>

      {/* ── Shadow beneath stage (right side) ────────────────────── */}

      <group position={[0, -58, -151.5]} rotation={[0, -7.069, 0]}>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>

          <planeGeometry args={[1500, 64]} />

          <meshBasicMaterial

            map={shadowMap}

            transparent

            opacity={0.5}

            depthWrite={false}

            blending={THREE.MultiplyBlending}

          />

        </mesh>

      </group>



      {/* ── Shadow beneath stage (left side) ─────────────────────── */}

      <group position={[0, -58, -151.5]} rotation={[0, 7.069, 0]}>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>

          <planeGeometry args={[1500, 64]} />

          <meshBasicMaterial

            map={shadowMap}

            transparent

            opacity={0.5}

            depthWrite={false}

            blending={THREE.MultiplyBlending}

          />

        </mesh>

      </group>



      {/* ── Glass Slab ────────────────────────────────────────────── */}

      <mesh

        geometry={geometry}

        position={[0, -4.75, -41.5]}

        rotation={[0., -7.069, 0]}    // Front edge raised, back edge lowered — more level

      >

        <meshPhysicalMaterial

          color="#e8f0ff"

          attenuationColor="#d0e8ff"

          attenuationDistance={1.5}



          transmission={0.85}

          ior={1.48}

          thickness={0.6}



          roughness={0.28}

          metalness={0.0}

          clearcoat={0.75}

          clearcoatRoughness={0.18}



          transparent

          opacity={0.75}

          alphaMap={alphaMap}



          envMapIntensity={0.8}

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

