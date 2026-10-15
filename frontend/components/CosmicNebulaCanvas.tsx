"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Eye, Compass, Zap } from "lucide-react";

interface Star {
  x: number;
  y: number;
  z: number;
  baseSize: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  angle: number;
  speed: number;
  driftX: number;
  driftY: number;
}

interface TransientFlash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export default function CosmicNebulaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hudActive, setHudActive] = useState<boolean>(true);
  const [warpActive, setWarpActive] = useState<boolean>(false);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse to [-1, 1]
      mouseRef.current.targetX = (e.clientX / width) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / height) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Color palettes for stars (O, B, A, F, G, K, M spectral classes)
    const starColors = [
      "rgba(147, 197, 253, ", // Blue-white (O/B)
      "rgba(199, 210, 254, ", // Pale violet
      "rgba(224, 231, 255, ", // Pure white (A)
      "rgba(254, 240, 138, ", // Yellow-white (F/G)
      "rgba(253, 186, 116, ", // Orange (K)
      "rgba(103, 232, 249, ", // Cyan pulse
      "rgba(216, 180, 254, ", // Neon lilac
    ];

    // Initialize 3D Stars
    const STAR_COUNT = 360;
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 1600,
        z: Math.random() * 1200 + 10,
        baseSize: Math.random() * 1.6 + 0.6,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Initialize Swirling Volumetric Nebula Clouds
    const clouds: NebulaCloud[] = [
      { x: -280, y: -160, radius: 480, color: "rgba(99, 102, 241, 0.08)", angle: 0, speed: 0.0003, driftX: 0.2, driftY: 0.1 },
      { x: 320, y: 140, radius: 520, color: "rgba(139, 92, 246, 0.07)", angle: 1.2, speed: -0.0002, driftX: -0.15, driftY: 0.2 },
      { x: 80, y: -220, radius: 420, color: "rgba(6, 182, 212, 0.06)", angle: 2.4, speed: 0.0004, driftX: 0.1, driftY: -0.15 },
      { x: -380, y: 240, radius: 460, color: "rgba(217, 70, 239, 0.05)", angle: 3.6, speed: -0.0003, driftX: -0.2, driftY: -0.1 },
      { x: 400, y: -180, radius: 390, color: "rgba(59, 130, 246, 0.06)", angle: 4.8, speed: 0.00025, driftX: 0.12, driftY: 0.18 },
    ];

    // Transient astrophysical flashes (Supernovae / Fast Radio Bursts)
    const flashes: TransientFlash[] = [];
    let flashTimer = 0;

    let time = 0;

    const render = () => {
      time += 0.016;
      flashTimer++;

      // Smooth camera interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      const camX = mouseRef.current.x * 60;
      const camY = mouseRef.current.y * 40;

      // Deep space base background
      ctx.fillStyle = "#040711";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Render Swirling Volumetric Nebula Dust Clouds
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      clouds.forEach((cloud) => {
        cloud.angle += cloud.speed;
        const orbitX = centerX + cloud.x + Math.cos(cloud.angle) * 70 - camX * 0.5;
        const orbitY = centerY + cloud.y + Math.sin(cloud.angle) * 50 - camY * 0.5;

        const grad = ctx.createRadialGradient(orbitX, orbitY, 10, orbitX, orbitY, cloud.radius);
        grad.addColorStop(0, cloud.color);
        grad.addColorStop(0.5, cloud.color.replace(/[\d\.]+\)$/, "0.03)"));
        grad.addColorStop(1, "rgba(4, 7, 17, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orbitX, orbitY, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 2. Render 3D Projected Starfield
      ctx.save();
      const fov = 380;
      const starSpeed = warpActive ? 6.5 : 0.65;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move stars forward in Z space
        star.z -= starSpeed;
        if (star.z <= 2) {
          star.z = 1200;
          star.x = (Math.random() - 0.5) * 2400;
          star.y = (Math.random() - 0.5) * 1600;
        }

        // 3D Perspective Projection
        const scale = fov / star.z;
        const px = (star.x - camX) * scale + centerX;
        const py = (star.y - camY) * scale + centerY;

        if (px >= -20 && px <= width + 20 && py >= -20 && py <= height + 20) {
          star.twinklePhase += star.twinkleSpeed;
          const twinkle = 0.55 + 0.45 * Math.sin(star.twinklePhase);
          const alpha = Math.min(1, (1 - star.z / 1200) * twinkle);
          const size = Math.max(0.7, star.baseSize * scale * (warpActive ? 1.4 : 1));

          // Draw star core
          ctx.fillStyle = `${star.color}${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          // Subtle star flare for close stars
          if (scale > 1.2 && !warpActive) {
            ctx.strokeStyle = `${star.color}${(alpha * 0.35).toFixed(2)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(px - size * 3, py);
            ctx.lineTo(px + size * 3, py);
            ctx.moveTo(px, py - size * 3);
            ctx.lineTo(px, py + size * 3);
            ctx.stroke();
          }

          // Warp trail when warp is engaged
          if (warpActive) {
            const prevScale = fov / (star.z + 18);
            const prevPx = (star.x - camX) * prevScale + centerX;
            const prevPy = (star.y - camY) * prevScale + centerY;
            ctx.strokeStyle = `${star.color}${(alpha * 0.6).toFixed(2)})`;
            ctx.lineWidth = size * 0.8;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(prevPx, prevPy);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 3. Occasional Astronomical Transient Flashes (Supernovae / FRB)
      if (flashTimer % 220 === 0 && Math.random() > 0.4) {
        flashes.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.8,
          radius: 2,
          maxRadius: Math.random() * 45 + 25,
          alpha: 0.9,
          color: Math.random() > 0.5 ? "rgba(56, 189, 248, " : "rgba(192, 132, 252, ",
        });
      }

      ctx.save();
      for (let i = flashes.length - 1; i >= 0; i--) {
        const flash = flashes[i];
        flash.radius += 1.8;
        flash.alpha -= 0.022;

        if (flash.alpha <= 0) {
          flashes.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `${flash.color}${flash.alpha.toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Expanding shockwave ripple
        ctx.strokeStyle = `${flash.color}${(flash.alpha * 0.5).toFixed(2)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Subtle HUD Astrometry Grid & Ticks (Scientific Overlay)
      if (hudActive) {
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
        ctx.lineWidth = 0.5;

        // Concentric range rings from center
        const maxR = Math.max(width, height) * 0.7;
        for (let r = 180; r < maxR; r += 240) {
          ctx.beginPath();
          ctx.arc(centerX - camX * 0.2, centerY - camY * 0.2, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crosshairs through optical axis
        ctx.beginPath();
        ctx.moveTo(centerX - camX * 0.2 - 25, centerY - camY * 0.2);
        ctx.lineTo(centerX - camX * 0.2 + 25, centerY - camY * 0.2);
        ctx.moveTo(centerX - camX * 0.2, centerY - camY * 0.2 - 25);
        ctx.lineTo(centerX - camX * 0.2, centerY - camY * 0.2 + 25);
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hudActive, warpActive]);

  return (
    <>
      {/* 3D Cosmic Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.95 }}
      />

      {/* Floating HUD Controls for User Engagement */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-full px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-xs text-slate-300">
        <button
          onClick={() => setHudActive(!hudActive)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full transition-all ${
            hudActive
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Toggle Astronomical Reticle and Grid Overlay"
        >
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>HUD Reticle</span>
        </button>

        <button
          onClick={() => setWarpActive(!warpActive)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full transition-all ${
            warpActive
              ? "bg-violet-500/25 text-violet-300 border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.4)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Engage Astrometric Warp Scan Velocity"
        >
          <Zap className={`w-3.5 h-3.5 ${warpActive ? "text-amber-400 animate-pulse" : ""}`} />
          <span>{warpActive ? "Warp Active" : "Warp Scan"}</span>
        </button>
      </div>
    </>
  );
}
