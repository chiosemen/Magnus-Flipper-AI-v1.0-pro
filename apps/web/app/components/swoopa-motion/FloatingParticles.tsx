"use client";

import { useEffect, useRef } from "react";

interface FloatingParticlesProps {
  layerCount?: number;
  particlesPerLayer?: number;
  speed?: number;
  color?: string;
}

export function FloatingParticles({
  layerCount = 3,
  particlesPerLayer = 20,
  speed = 0.5,
  color = "rgba(147, 51, 234, 0.4)",
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      layer: number;
    }> = [];

    for (let layer = 0; layer < layerCount; layer++) {
      for (let i = 0; i < particlesPerLayer; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed * (layer + 1) * 0.5,
          vy: (Math.random() - 0.5) * speed * (layer + 1) * 0.5,
          size: Math.random() * (3 - layer) + 1,
          layer,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        const opacity = 0.3 - particle.layer * 0.1;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace("0.4", opacity.toString());
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [layerCount, particlesPerLayer, speed, color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

