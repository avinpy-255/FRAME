import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function DustParticles() {
  const count = 150;
  const meshRef = useRef();

  // Generate random floating particles
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 35;
      pos[i + 1] = (Math.random() - 0.5) * 20;
      pos[i + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Very slow drift rotation
      meshRef.current.rotation.y += 0.015 * delta;
      meshRef.current.rotation.x += 0.008 * delta;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.06}
        sizeAttenuation={true}
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </points>
  );
}
