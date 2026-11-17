"use client";

import { useEffect, useState } from "react";

export default function ParticlesBackground() {
  const [particles, setParticles] = useState<
    { id: number; left: string; delay: string; duration: string }[]
  >([]);

  useEffect(() => {
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 10}s`,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="particles-bg">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
      {/* Soft radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-red-400/5 blur-3xl" />
    </div>
  );
}
