
"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const [earthTexture, normalTexture, cloudTexture, lightsTexture] =
    useLoader(THREE.TextureLoader, [
      "/textures/earth.jpg",
      "/textures/earth_normal.jpg",
      "/textures/earth_clouds.png",
      "/textures/earth_lights.png",
    ]);

  earthTexture.colorSpace = THREE.SRGBColorSpace;
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  lightsTexture.colorSpace = THREE.SRGBColorSpace;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.025;
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {/* Real Earth surface */}
        <mesh>
          <sphereGeometry args={[2, 96, 96]} />
          <meshStandardMaterial
            map={earthTexture}
            normalMap={normalTexture}
            normalScale={new THREE.Vector2(0.45, 0.45)}
            roughness={0.95}
            metalness={0}
          />
        </mesh>

        {/* Night-side city lights */}
        <mesh scale={1.001}>
          <sphereGeometry args={[2, 96, 96]} />
          <meshBasicMaterial
            map={lightsTexture}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Moving cloud layer */}
      <mesh ref={cloudRef} scale={1.008}>
        <sphereGeometry args={[2, 96, 96]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.28}
          depthWrite={false}
          roughness={1}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh scale={1.045}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#159dff"
          side={THREE.BackSide}
          transparent
          opacity={0.23}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer blue atmospheric rim */}
      <mesh scale={1.065}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#0077ff"
          side={THREE.BackSide}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function StarField() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = new Float32Array(1800 * 3);

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * 45;
    positions[i + 1] = (Math.random() - 0.5) * 45;
    positions[i + 2] = (Math.random() - 0.5) * 45;
  }

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#b8e8ff"
        size={0.035}
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={["#030914"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 3, 5]} intensity={2.5} />
      <pointLight
        position={[-5, -2, -4]}
        color="#008cff"
        intensity={5}
      />

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
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#1266a0" wireframe />
    </mesh>
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
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
