import React, {
  Suspense,
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function FallingRailwayObjects({ isDark }) {
  const group = useRef();
  const count = 20;

  const objects = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 15,
        y: Math.random() * 15,
        z: (Math.random() - 0.5) * 10,
        speed: 0.05 + Math.random() * 0.03,
        type: i % 3,
        rotationSpeed: {
          x: Math.random() * 0.1,
          y: Math.random() * 0.1,
        },
      });
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const obj = objects[i];
      child.position.y -= obj.speed * delta * 1.5;
      child.rotation.x += delta * obj.rotationSpeed.x;
      child.rotation.y += delta * obj.rotationSpeed.y;

      if (child.position.y < -8) {
        child.position.y = 8 + Math.random() * 3;
        child.position.x = (Math.random() - 0.5) * 15;
      }
    });
  });

  return (
    <group ref={group}>
      {objects.map((obj, i) => {
        const baseColor = isDark ? "#bbb" : "#666";
        const railColor = isDark ? "#aaa" : "#444";
        const goldColor = isDark ? "#facc15" : "#b8860b";

        switch (obj.type) {
          case 0:
            return (
              <mesh
                key={i}
                position={[obj.x, obj.y, obj.z]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <torusGeometry args={[0.4, 0.1, 16, 32]} />
                <meshStandardMaterial
                  color={baseColor}
                  metalness={0.8}
                  roughness={0.4}
                  emissive={isDark ? "#444" : "#888"}
                  emissiveIntensity={0.2}
                />
              </mesh>
            );
          case 1:
            return (
              <mesh key={i} position={[obj.x, obj.y, obj.z]}>
                <boxGeometry args={[1.2, 0.15, 0.2]} />
                <meshStandardMaterial
                  color={railColor}
                  metalness={0.6}
                  roughness={0.4}
                  emissive={isDark ? "#333" : "#777"}
                  emissiveIntensity={0.2}
                />
              </mesh>
            );
          default:
            return (
              <mesh key={i} position={[obj.x, obj.y, obj.z]}>
                <cylinderGeometry args={[0.15, 0.15, 0.8, 24]} />
                <meshStandardMaterial
                  color={goldColor}
                  metalness={0.8}
                  roughness={0.3}
                  emissive={isDark ? "#aa8800" : "#d4b300"}
                  emissiveIntensity={0.3}
                />
              </mesh>
            );
        }
      })}
    </group>
  );
}

function FloatingParticles({ isDark, cursor }) {
  const count = 40;
  const particles = useRef();

  useFrame((state, delta) => {
    if (!particles.current) return;
    particles.current.rotation.y += delta * 0.03;
    particles.current.children.forEach((p) => {
      p.position.x += (cursor.current.x - p.position.x) * 0.0005;
      p.position.y += (cursor.current.y - p.position.y) * 0.0005;
    });
  });

  return (
    <group ref={particles}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 8,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={isDark ? "#66ccff" : "#ffcc66"}
            opacity={0.4}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function TrainSilhouette({ isDark }) {
  const mesh = useRef();
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.position.x =
        Math.sin(state.clock.elapsedTime * 0.1) * 5 - 5;
    }
  });
  return (
    <mesh ref={mesh} position={[0, -3.5, -5]} rotation={[0, 0, 0]}>
      <boxGeometry args={[3, 1, 0.1]} />
      <meshBasicMaterial
        color={isDark ? "#111" : "#ccc"}
        opacity={isDark ? 0.4 : 0.2}
        transparent
      />
    </mesh>
  );
}

export default function Background3D() {
  const [isDark, setIsDark] = useState(false);
  const cursor = useRef({ x: 0, y: 0 });

  // Detect theme
  useEffect(() => {
    const checkTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Track cursor
  const handleMouseMove = useCallback((e) => {
    cursor.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    cursor.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <Canvas
      className="absolute inset-0 z-0"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        background: isDark
          ? "linear-gradient(to bottom, #0a0a2a 0%, #000 90%)"
          : "linear-gradient(to bottom, #e0f2ff 0%, #ffffff 90%)",
        transition: "background 0.5s ease",
      }}
      camera={{ position: [0, 0, 10], fov: 65 }}
    >
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.6 : 0.9} />
      <pointLight
        position={[10, 10, 10]}
        intensity={isDark ? 1.2 : 0.8}
        color={isDark ? "#ffffff" : "#ffd580"}
      />
      <pointLight
        position={[-5, -5, -5]}
        intensity={isDark ? 0.5 : 0.3}
        color={isDark ? "#0066ff" : "#ffd1a1"}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={[isDark ? "#000010" : "#f5f9ff", 5, 20]} />

      <Suspense fallback={null}>
        {isDark && (
          <Stars
            radius={120}
            depth={60}
            count={600}
            factor={4}
            fade
            speed={0.15}
          />
        )}
        <TrainSilhouette isDark={isDark} />
        <FloatingParticles isDark={isDark} cursor={cursor} />
        <FallingRailwayObjects isDark={isDark} />
      </Suspense>
    </Canvas>
  );
}
