
"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type EarthSceneProps = {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
};

const EARTH_RADIUS = 2;
const ORBIT_RADIUS = 2.14;

function coordinatesToVector(
  latitude: number,
  longitude: number,
  radius: number,
): THREE.Vector3 {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  return new THREE.Vector3(
    -radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
}

function Earth({
  latitude,
  longitude,
  altitude,
}: EarthSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

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

  const hasPosition = latitude !== null && longitude !== null;

  const markerPosition = useMemo(() => {
    if (!hasPosition) return new THREE.Vector3(0, 0, ORBIT_RADIUS);

    // Scale the reported altitude relative to Earth's radius.
    // The scale is intentionally exaggerated slightly for visibility.
    const height = Math.max(0, altitude ?? 400);
    const markerRadius = ORBIT_RADIUS + Math.min(height / 6371, 0.12);

    return coordinatesToVector(latitude, longitude, markerRadius);
  }, [latitude, longitude, altitude, hasPosition]);

  const orbitPoints = useMemo(() => {
    const center = markerPosition.clone().normalize();

    // Build an illustrative great-circle orbit passing through the
    // current marker. This is not a propagated ISS orbital prediction.
    const north = new THREE.Vector3(0, 1, 0);
    let tangent = new THREE.Vector3().crossVectors(north, center);

    if (tangent.lengthSq() < 0.0001) {
      tangent = new THREE.Vector3().crossVectors(
        new THREE.Vector3(1, 0, 0),
        center,
      );
    }

    tangent.normalize();

    const points: THREE.Vector3[] = [];
    const segments = 240;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      const point = center
        .clone()
        .multiplyScalar(Math.cos(angle))
        .add(tangent.clone().multiplyScalar(Math.sin(angle)))
        .multiplyScalar(markerPosition.length());

      points.push(point);
    }

    return points;
  }, [markerPosition]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.025;
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.008;
    }

    if (markerRef.current) {
      markerRef.current.position.copy(markerPosition);
    }

    if (pulseRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.22;
      pulseRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {/* Textured Earth */}
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
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
          <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
          <meshBasicMaterial
            map={lightsTexture}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Illustrative orbital trajectory */}
        <Line
          points={orbitPoints}
          color="#00f2fe"
          lineWidth={1.4}
          transparent
          opacity={0.8}
        />

        {/* ISS marker and pulsing locator */}
        <group ref={markerRef} position={markerPosition}>
          <mesh>
            <sphereGeometry args={[0.055, 20, 20]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          <mesh ref={pulseRef}>
            <sphereGeometry args={[0.105, 20, 20]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>

          <pointLight
            color="#00f2fe"
            intensity={1.4}
            distance={0.7}
          />
        </group>
      </group>

      {/* Moving cloud layer */}
      <mesh ref={cloudRef} scale={1.008}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
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
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#159dff"
          side={THREE.BackSide}
          transparent
          opacity={0.23}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmospheric rim */}
      <mesh scale={1.065}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
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

  const positions = useMemo(() => {
    const array = new Float32Array(1800 * 3);

    for (let i = 0; i < array.length; i += 3) {
      array[i] = (Math.random() - 0.5) * 45;
      array[i + 1] = (Math.random() - 0.5) * 45;
      array[i + 2] = (Math.random() - 0.5) * 45;
    }

    return array;
  }, []);

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

function SceneContent(props: EarthSceneProps) {
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
      <Earth {...props} />

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
      <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
      <meshStandardMaterial color="#1266a0" wireframe />
    </mesh>
  );
}

export default function EarthScene(props: EarthSceneProps) {
  return (
    <div className="earth-scene">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
