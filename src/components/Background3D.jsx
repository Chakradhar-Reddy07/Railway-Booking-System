import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

function MovingObjects() {
  const group = useRef();
  useFrame(({ clock }) => {
    group.current.rotation.y = clock.getElapsedTime() / 5;
  });
  return (
    <group ref={group}>
      <mesh position={[2,1,-5]}>
        <sphereGeometry args={[0.5, 32,32]} />
        <meshStandardMaterial color="#00f" />
      </mesh>
      <mesh position={[-2,-1,-3]}>
        <boxGeometry args={[1,1,1]} />
        <meshStandardMaterial color="#0f0" />
      </mesh>
      <mesh position={[0,2,-6]}>
        <coneGeometry args={[0.5,1,32]} />
        <meshStandardMaterial color="#f00" />
      </mesh>
    </group>
  );
}

export default function Background3D() {
  return (
    <Canvas   className="absolute inset-0 z-10"
  style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10,10,10]} />
      <Suspense fallback={null}>
        <Stars radius={100} depth={50} count={500} factor={4} fade />
        <MovingObjects />
      </Suspense>
    </Canvas>
  );
}
