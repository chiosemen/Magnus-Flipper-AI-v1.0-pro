"use client";

import { useEffect, useRef, useState } from "react";

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
  const [isMounted, setIsMounted] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Guard against SSR
    if (typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      if (typeof window === "undefined") return;
      canvas.width = window.innerWidth || 1920;
      canvas.height = window.innerHeight || 1080;
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

    // Only create particles after canvas is sized
    if (canvas.width > 0 && canvas.height > 0) {
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
    }

    const animate = () => {
      if (!canvas || !ctx) return;

      try {
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

        animationFrameRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("FloatingParticles animation error:", error);
      }
    };

    animate();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", resize);
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMounted, layerCount, particlesPerLayer, speed, color]);

  if (!isMounted) {
    return null;
  }

  return (
    <canvas
      id="stars"
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0, // IMPORTANT
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        opacity: 0.6,
      }}
    />
  );
}

