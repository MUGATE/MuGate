// Logo3D — kept for backward compatibility
import React, { useMemo } from 'react';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import * as THREE from 'three';

const Logo3D = ({ paths, colors, scale = 0.01, isMetallic = false, isEmissive = false }) => {
    const shapes = useMemo(() => {
        return paths.flatMap((pathData, index) => {
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}" /></svg>`;
            const loader = new SVGLoader();
            const svgData = loader.parse(svgString);
            return svgData.paths.flatMap((p) =>
                p.toShapes(true).map(shape => ({
                    shape,
                    color: colors[index % colors.length],
                }))
            );
        });
    }, [paths, colors]);

    return (
        <group scale={[scale, -scale, scale]}>
            <group position={[-12, 12, 0]}>
                {shapes.map((item, i) => (
                    <mesh key={i} castShadow receiveShadow>
                        <extrudeGeometry args={[item.shape, {
                            depth: isMetallic ? 20 : 10,
                            bevelEnabled: true, bevelThickness: 2, bevelSize: 1, bevelSegments: 5
                        }]} />
                        {isMetallic ? (
                            <meshStandardMaterial color={item.color} metalness={0.9} roughness={0.2} envMapIntensity={1} />
                        ) : (
                            <meshPhysicalMaterial color={item.color}
                                emissive={isEmissive ? item.color : '#000'}
                                emissiveIntensity={isEmissive ? 2 : 0}
                                toneMapped={false} metalness={0.1} roughness={0.5} />
                        )}
                    </mesh>
                ))}
            </group>
        </group>
    );
};

export default Logo3D;
