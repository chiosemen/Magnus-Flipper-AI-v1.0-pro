"use client";

import { useEffect, useRef } from "react";

interface SwoopaAIOrbProps {
  size?: number;
  particleCount?: number;
}

export function SwoopaAIOrb({
  size = 200,
  particleCount = 20,
}: SwoopaAIOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    const particles: Array<{
      angle: number;
      speed: number;
      distance: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: (i * 360) / particleCount,
        speed: 0.5 + Math.random() * 0.5,
        distance: radius * (0.7 + Math.random() * 0.3),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "rgba(147, 51, 234, 0.3)");
      gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.2)");
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw particles
      particles.forEach((particle, idx) => {
        const x = centerX + Math.cos((particle.angle * Math.PI) / 180) * particle.distance;
        const y = centerY + Math.sin((particle.angle * Math.PI) / 180) * particle.distance;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 51, 234, 0.8)";
        ctx.fill();

        // Draw connection lines
        const nextParticle = particles[(idx + 1) % particles.length];
        const nextX =
          centerX +
          Math.cos((nextParticle.angle * Math.PI) / 180) * nextParticle.distance;
        const nextY =
          centerY +
          Math.sin((nextParticle.angle * Math.PI) / 180) * nextParticle.distance;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nextX, nextY);
        ctx.strokeStyle = "rgba(147, 51, 234, 0.2)";
        ctx.stroke();
      });
    };

    // Static render: keep the orb calm and GPU-light (no rAF loop).
    draw();
  }, [size, particleCount]);

  return (
    <div className="absolute" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
