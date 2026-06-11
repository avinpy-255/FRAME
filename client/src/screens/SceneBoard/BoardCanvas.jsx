import React from 'react';
import { Canvas } from '@react-three/fiber';
import DustParticles from './DustParticles';

export default function BoardCanvas() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Dark background color */}
        <color attach="background" args={['#070708']} />
        
        {/* Lights */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[-5, 8, 5]} 
          intensity={0.6} 
          color="#F2F0EB"
        />
        
        {/* Spotlight warm center glow */}
        <spotLight
          position={[0, 5, 8]}
          angle={0.6}
          penumbra={1}
          intensity={0.8}
          color="#E8C547"
        />

        {/* Floating dust particles */}
        <DustParticles />

        {/* 3D Cork Board Surface */}
        <mesh position={[0, 0, -2]} rotation={[-0.1, 0, 0]}>
          <planeGeometry args={[50, 30]} />
          <meshStandardMaterial 
            color="#0b0b0d" 
            roughness={0.9} 
            metalness={0.1}
          />
        </mesh>
      </Canvas>
    </div>
  );
}
