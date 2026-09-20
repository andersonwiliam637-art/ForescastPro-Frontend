"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Text, Environment } from "@react-three/drei";
import { useMemo } from "react";
import { PredictPoint } from "@/lib/api";
import * as THREE from "three";

function ForecastBars({ data }: { data: PredictPoint[] }) {
  const bars = useMemo(() => {
    if (!data.length) return [];
    const max = Math.max(...data.map((d) => d.yhat), 1);
    return data.slice(0, 24).map((d, i) => {
      const height = (d.yhat / max) * 3.5;
      return {
        position: [i * 0.55 - (Math.min(data.length, 24) * 0.55) / 2, height / 2, 0] as [
          number,
          number,
          number
        ],
        height,
        color: new THREE.Color().setHSL(0.55 - (i / 24) * 0.15, 0.7, 0.55),
      };
    });
  }, [data]);

  return (
    <group>
      {bars.map((bar, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh position={bar.position} castShadow>
            <boxGeometry args={[0.4, bar.height, 0.4]} />
            <meshStandardMaterial
              color={bar.color}
              metalness={0.4}
              roughness={0.3}
              emissive={bar.color}
              emissiveIntensity={0.15}
            />
          </mesh>
        </Float>
      ))}
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
}

interface Props {
  data: PredictPoint[];
}

export default function Forecast3D({ data }: Props) {
  return (
    <div className="w-full h-[280px] md:h-[340px] rounded-xl overflow-hidden bg-slate-900/50 border border-slate-700/40">
      <Canvas
        camera={{ position: [0, 4, 9], fov: 45 }}
        shadows
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-4, 3, -2]} intensity={0.5} color="#38BDF8" />
        <ForecastBars data={data} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={14}
          autoRotate
          autoRotateSpeed={0.6}
        />
        <Environment preset="night" />
      </Canvas>
      <div className="absolute bottom-2 left-3 text-[10px] text-slate-500 pointer-events-none">
        Arrastra para rotar · Scroll para zoom
      </div>
    </div>
  );
}
