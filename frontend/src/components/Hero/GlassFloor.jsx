/**
 * GlassFloor  Flat physical floor slab.
 * PlaneGeometry 20x20, meshStandardMaterial, color #e5e7eb.
 * No reflection, no blur, no mirror, no depth tricks.
 */
const GlassFloor = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
    <planeGeometry args={[20, 20]} />
    <meshStandardMaterial color="#e5e7eb" />
  </mesh>
);

export default GlassFloor;
