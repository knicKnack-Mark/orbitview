
"use client";

import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import {
  Suspense,
  type ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import ISSModel from "@/components/ISSModel";

type EarthSceneProps = {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
};

type CameraMode = "globe" | "follow";

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
  onSelect,
  onMarkerWorldPosition,
}: EarthSceneProps & {
  showOrbit: boolean;
  onSelect: () => void;
  onMarkerWorldPosition: (position: THREE.Vector3) => void;
}) {
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

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.025;

      // Publish the ISS marker's true world position after Earth's rotation.
      const worldPosition = markerPosition.clone();
      groupRef.current.localToWorld(worldPosition);
      onMarkerWorldPosition(worldPosition);
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.008;
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

        <ISSModel position={markerPosition} onClick={onSelect} />
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
  onSelect,
  resetSignal,
  cameraMode,
}: EarthSceneProps & {
  showOrbit: boolean;
  onSelect: () => void;
  resetSignal: number;
  cameraMode: CameraMode;
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const followPosition = useRef<THREE.Vector3 | null>(null);
  const handleMarkerWorldPosition = useCallback((position: THREE.Vector3) => {
    if (!followPosition.current) {
      followPosition.current = position.clone();
    } else {
      followPosition.current.copy(position);
    }
  }, []);
  const cameraTransition = useRef<{
    active: boolean;
    elapsed: number;
    duration: number;
    startPosition: THREE.Vector3;
    endPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    // Follow mode is handled continuously in useFrame so the camera can
    // follow the ISS as Earth rotates and new coordinates arrive.
    if (cameraMode === "follow") {
      cameraTransition.current = null;
      return;
    }

    if (resetSignal === 0 && cameraMode === "globe") return;

    const controls = controlsRef.current;
    if (!controls) return;

    cameraTransition.current = {
      active: true,
      elapsed: 0,
      duration: 1.4,
      startPosition: camera.position.clone(),
      endPosition: new THREE.Vector3(0, 0, 7),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(0, 0, 0),
    };
  }, [cameraMode, resetSignal, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    if (cameraMode === "follow" && followPosition.current && controls) {
      const target = followPosition.current;
      const outward = target.clone().normalize();
      const desiredPosition = target
        .clone()
        .add(outward.multiplyScalar(1.55))
        .add(new THREE.Vector3(0, 0.22, 0));
      const smoothing = 1 - Math.exp(-delta * 2.8);

      controls.target.lerp(target, smoothing);
      camera.position.lerp(desiredPosition, smoothing);
      controls.update();
      return;
    }

    const transition = cameraTransition.current;
    if (!transition?.active) return;

    transition.elapsed += delta;

    const progress = Math.min(
      transition.elapsed / transition.duration,
      1,
    );
    const eased = progress * progress * (3 - 2 * progress);

    camera.position.lerpVectors(
      transition.startPosition,
      transition.endPosition,
      eased,
    );

    const orbitControls = controlsRef.current;

    if (orbitControls) {
      orbitControls.target.lerpVectors(
        transition.startTarget,
        transition.endTarget,
        eased,
      );

      orbitControls.update();
    }

    if (progress >= 1) {
      camera.position.copy(transition.endPosition);

      if (orbitControls) {
        orbitControls.target.copy(transition.endTarget);
        orbitControls.update();
      }

      cameraTransition.current = null;
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
        onSelect={onSelect}
        onMarkerWorldPosition={handleMarkerWorldPosition}
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
  const [cameraMode, setCameraMode] = useState<CameraMode>("globe");

  const resetCamera = useCallback(() => {
    setCameraMode("globe");
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

        <div className="orbit-camera-controls">
          <button
            type="button"
            className={cameraMode === "globe" ? "active" : ""}
            aria-pressed={cameraMode === "globe"}
            onClick={() => setCameraMode("globe")}
          >
            Globe View
          </button>

          <button
            type="button"
            className={cameraMode === "follow" ? "active" : ""}
            aria-pressed={cameraMode === "follow"}
            onClick={() => setCameraMode("follow")}
          >
            Follow ISS
          </button>
        </div>

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
              onSelect={() => setSelected(true)}
              resetSignal={resetSignal}
              cameraMode={cameraMode}
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
