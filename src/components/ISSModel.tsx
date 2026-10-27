
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ISSModelProps = {
  position: THREE.Vector3 | [number, number, number];
  onClick?: () => void;
};

function SolarArray({ side }: { side: -1 | 1 }) {
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: "#245c91",
    emissive: "#123b68",
    emissiveIntensity: 0.35,
    metalness: 0.55,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#c8d4df",
    metalness: 0.85,
    roughness: 0.28,
  });

  return (
    <group position={[side * 1.05, 0, 0]}>
      {/* Solar array support */}
      <mesh
        position={[side * 0.82, 0, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[1.7, 0.035, 0.055]} />
      </mesh>

      {/* Two blue solar panel wings */}
      {[-1, 1].map((wing) => (
        <group
          key={wing}
          position={[side * 0.82, 0, wing * 0.31]}
        >
          <mesh material={panelMaterial}>
            <boxGeometry args={[1.48, 0.025, 0.56]} />
          </mesh>

          {/* Fine panel grid */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh
              key={`v-${i}`}
              position={[
                -0.67 + i * 0.149,
                0.016,
                0,
              ]}
              material={frameMaterial}
            >
              <boxGeometry args={[0.008, 0.008, 0.56]} />
            </mesh>
          ))}

          {Array.from({ length: 5 }).map((_, i) => (
            <mesh
              key={`h-${i}`}
              position={[0, 0.017, -0.23 + i * 0.115]}
              material={frameMaterial}
            >
              <boxGeometry args={[1.48, 0.008, 0.008]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function ISSModel({
  position,
  onClick,
}: ISSModelProps) {
  const rotationRef = useRef<THREE.Group>(null);

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: "#dce5eb",
    metalness: 0.8,
    roughness: 0.3,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#d6a85c",
    metalness: 0.72,
    roughness: 0.3,
  });

  useFrame((_, delta) => {
    if (rotationRef.current) {
      rotationRef.current.rotation.y += delta * 0.16;
      rotationRef.current.rotation.z =
        Math.sin(performance.now() * 0.00035) * 0.035;
    }
  });

  return (
    <group position={position} scale={0.075}>
      {/* Keep the station clickable without a neon ring */}
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <sphereGeometry args={[2.4, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <group ref={rotationRef}>
        {/* Main truss */}
        <mesh material={hullMaterial}>
          <boxGeometry args={[4.5, 0.09, 0.1]} />
        </mesh>

        {/* Solar arrays on both sides */}
        <SolarArray side={-1} />
        <SolarArray side={1} />

        {/* Central pressurized modules */}
        <mesh
          position={[0, 0.16, 0]}
          material={hullMaterial}
        >
          <cylinderGeometry args={[0.22, 0.22, 0.95, 12]} />
        </mesh>

        <mesh
          position={[0.48, 0.15, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={hullMaterial}
        >
          <cylinderGeometry args={[0.17, 0.17, 0.75, 12]} />
        </mesh>

        <mesh
          position={[-0.48, 0.15, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={hullMaterial}
        >
          <cylinderGeometry args={[0.16, 0.16, 0.7, 12]} />
        </mesh>

        {/* Laboratory modules */}
        {[-0.5, 0.5].map((x) => (
          <mesh
            key={x}
            position={[x, 0.33, 0]}
            material={goldMaterial}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.24, 10]} />
          </mesh>
        ))}

        {/* Connecting node */}
        <mesh
          position={[0, 0.38, 0]}
          material={hullMaterial}
        >
          <sphereGeometry args={[0.16, 12, 12]} />
        </mesh>

        {/* Radiators */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[0, 0.25, side * 0.42]}
            material={hullMaterial}
          >
            <boxGeometry args={[0.55, 0.045, 0.22]} />
          </mesh>
        ))}

        {/* Small antenna mast */}
        <mesh
          position={[0, 0.58, 0]}
          material={hullMaterial}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
        </mesh>

        {/* Communications dish */}
        <mesh
          position={[0, 0.74, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={hullMaterial}
        >
          <coneGeometry args={[0.13, 0.07, 12, 1, true]} />
        </mesh>
      </group>
    </group>
  );
}
