
"use client";

import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
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
  showOrbit,
  selected,
  onSelect,
}: EarthSceneProps & {
  showOrbit: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
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

    const height = Math.max(0, altitude ?? 400);
    const markerRadius = ORBIT_RADIUS + Math.min(height / 6371, 0.12);

    return coordinatesToVector(latitude, longitude, markerRadius);
  }, [latitude, longitude, altitude, hasPosition]);

  const orbitPoints = useMemo(() => {
    const center = markerPosition.clone().normalize();
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

      points.push(
        center
          .clone()
          .multiplyScalar(Math.cos(angle))
          .add(tangent.clone().multiplyScalar(Math.sin(angle)))
          .multiplyScalar(markerPosition.length()),
      );
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

        {showOrbit && (
          <Line
            points={orbitPoints}
            color="#00f2fe"
            lineWidth={1.4}
            transparent
            opacity={0.8}
          />
        )}

        <group
          ref={markerRef}
          position={markerPosition}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          {/* Larger invisible hit target makes the ISS easier to select. */}
          <mesh>
            <sphereGeometry args={[0.17, 16, 16]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>

          <mesh>
            <sphereGeometry args={[0.055, 20, 20]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          <mesh ref={pulseRef}>
            <sphereGeometry args={[selected ? 0.15 : 0.105, 20, 20]} />
            <meshBasicMaterial
              color={selected ? "#ffffff" : "#00f2fe"}
              transparent
              opacity={selected ? 0.32 : 0.22}
              depthWrite={false}
            />
          </mesh>

          <pointLight color="#00f2fe" intensity={1.4} distance={0.7} />
        </group>
      </group>

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

function SceneContent({
  latitude,
  longitude,
  altitude,
  showOrbit,
  selected,
  onSelect,
  resetSignal,
}: EarthSceneProps & {
  showOrbit: boolean;
  selected: boolean;
  onSelect: () => void;
  resetSignal: number;
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const previousReset = useRef(resetSignal);

  useFrame(() => {
    if (previousReset.current !== resetSignal) {
      previousReset.current = resetSignal;
      camera.position.set(0, 0, 7);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
    }
  });

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

      <Earth
        latitude={latitude}
        longitude={longitude}
        altitude={altitude}
        showOrbit={showOrbit}
        selected={selected}
        onSelect={onSelect}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        minDistance={3.2}
        maxDistance={10}
        rotateSpeed={0.65}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.06}
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
  const [showOrbit, setShowOrbit] = useState(true);
  const [selected, setSelected] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  const resetCamera = useCallback(() => {
    setResetSignal((value) => value + 1);
  }, []);

  return (
    <div className="earth-scene-wrap">
      <div className="earth-scene-controls">
        <button
          type="button"
          className="earth-control-button"
          onClick={() => setShowOrbit((value) => !value)}
        >
          {showOrbit ? "Hide orbit" : "Show orbit"}
        </button>

        <button
          type="button"
          className="earth-control-button"
          onClick={resetCamera}
        >
          Reset camera
        </button>
      </div>

      <div className="earth-scene">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <SceneContent
              {...props}
              showOrbit={showOrbit}
              selected={selected}
              onSelect={() => setSelected((value) => !value)}
              resetSignal={resetSignal}
            />
          </Suspense>
        </Canvas>
      </div>

      {selected && (
        <div className="iss-inspection-panel">
          <div className="iss-inspection-heading">
            <span className="status-dot" />
            ISS TRACKING TARGET
            <button
              type="button"
              onClick={() => setSelected(false)}
              aria-label="Close ISS inspection panel"
            >
              ×
            </button>
          </div>

          <div className="iss-inspection-coordinates">
            <span>LATITUDE</span>
            <strong>
              {props.latitude === null
                ? "Waiting…"
                : `${props.latitude.toFixed(4)}°`}
            </strong>
          </div>

          <div className="iss-inspection-coordinates">
            <span>LONGITUDE</span>
            <strong>
              {props.longitude === null
                ? "Waiting…"
                : `${props.longitude.toFixed(4)}°`}
            </strong>
          </div>

          <div className="iss-inspection-coordinates">
            <span>ALTITUDE</span>
            <strong>
              {props.altitude === null
                ? "—"
                : `${props.altitude.toFixed(1)} km`}
            </strong>
          </div>

          <p className="iss-inspection-note">
            Select the marker again or close this panel to dismiss.
          </p>
        </div>
      )}
    </div>
  );
}
