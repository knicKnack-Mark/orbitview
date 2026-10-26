
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.035;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 96, 96]} />
        <meshStandardMaterial
          color="#1769aa"
          roughness={0.85}
          metalness={0.05}
          emissive="#031b35"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh scale={1.035}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#00d9ff"
          transparent
          opacity={0.10}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function StarField() {
  const points = useRef<THREE.Points>(null);

  const positions = new Float32Array(1800 * 3);

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * 45;
    positions[i + 1] = (Math.random() - 0.5) * 45;
    positions[i + 2] = (Math.random() - 0.5) * 45;
  }

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a8eaff"
        size={0.035}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

export default function EarthScene() {
  return (
    <div className="earth-scene">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 3, 5]} intensity={3} />
        <pointLight position={[-5, -2, -4]} color="#008cff" intensity={8} />

        <StarField />
        <Earth />

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={3.2}
          maxDistance={10}
          rotateSpeed={0.65}
          zoomSpeed={0.7}
        />
      </Canvas>
    </div>
  );
}
