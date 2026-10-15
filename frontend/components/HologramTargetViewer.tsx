"use client";

import React, { useEffect, useRef, useState } from "react";
import { AstronomicalTarget } from "@/lib/api";
import { Orbit, RotateCw, ZoomIn, Eye, Sparkles } from "lucide-react";

interface HologramTargetViewerProps {
  target?: AstronomicalTarget;
}

export default function HologramTargetViewer({ target }: HologramTargetViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const rotationRef = useRef<{ x: number; y: number; isDragging: boolean; lastMouseX: number; lastMouseY: number }>({
    x: 0.35,
    y: 0.45,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = 240);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 240;
    };
    window.addEventListener("resize", handleResize);

    // Mouse drag rotation controls
    const onMouseDown = (e: MouseEvent) => {
      rotationRef.current.isDragging = true;
      rotationRef.current.lastMouseX = e.clientX;
      rotationRef.current.lastMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!rotationRef.current.isDragging) return;
      const dx = e.clientX - rotationRef.current.lastMouseX;
      const dy = e.clientY - rotationRef.current.lastMouseY;
      rotationRef.current.y += dx * 0.008;
      rotationRef.current.x += dy * 0.008;
      rotationRef.current.lastMouseX = e.clientX;
      rotationRef.current.lastMouseY = e.clientY;
    };
    const onMouseUp = () => {
      rotationRef.current.isDragging = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let tick = 0;

    const render = () => {
      tick++;
      if (isRotating && !rotationRef.current.isDragging) {
        rotationRef.current.y += 0.009;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const r = 75;

      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;

      // Project 3D point (x, y, z) with rotation
      const project = (x: number, y: number, z: number) => {
        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const scale = 220 / (220 + z2);
        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          depth: z2,
          scale,
        };
      };

      // 1. Draw 3D Celestial Wireframe Sphere (Latitude / Longitude Rings)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.22)";

      // Equator and latitude circles
      [-40, 0, 40].forEach((latOffset) => {
        const ringR = Math.sqrt(Math.max(0, r * r - latOffset * latOffset));
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
          const pt = project(Math.cos(a) * ringR, latOffset, Math.sin(a) * ringR);
          if (a === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
      });

      // Longitude meridian circles
      [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((lonAngle) => {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
          const cosA = Math.cos(a);
          const sinA = Math.sin(a);
          const x = r * sinA * Math.cos(lonAngle);
          const y = r * cosA;
          const z = r * sinA * Math.sin(lonAngle);
          const pt = project(x, y, z);
          if (a === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
      });

      // 2. Draw Target-Specific Astrophysical 3D Feature
      const targetType = target?.target_id || "SN-2026-X1";

      if (targetType.includes("SN")) {
        // Supernova: Expanding Photometric Blast Shockwaves
        const pulseR = (tick % 70) * 1.1;
        const pt = project(0, 0, 0);

        ctx.strokeStyle = `rgba(244, 63, 94, ${(1 - pulseR / 77).toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Crosshair reticle
        ctx.strokeStyle = "rgba(244, 63, 94, 0.7)";
        ctx.strokeRect(pt.px - 9, pt.py - 9, 18, 18);
      } else if (targetType.includes("AST") || targetType.includes("NEO")) {
        // Asteroid: Moving Orbital Vector
        ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let t = -30; t <= 30; t += 3) {
          const pt = project(t * 2, -t * 0.8, t * 1.4);
          if (t === -30) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Active moving asteroid position
        const asteroidPos = ((tick * 0.8) % 60) - 30;
        const apt = project(asteroidPos * 2, -asteroidPos * 0.8, asteroidPos * 1.4);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(apt.px, apt.py, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (targetType.includes("GLITCH") || targetType.includes("ART")) {
        // Instrumental Glitch: Needle Spike & Bad Pixels
        const pt = project(0, 0, 0);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pt.px, pt.py - 22);
        ctx.lineTo(pt.px, pt.py + 22);
        ctx.stroke();

        ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
        ctx.fillRect(pt.px - 6, pt.py - 6, 12, 12);
      } else {
        // Variable Blazar / Core Point Source: Swirling Accretion Disk
        const pt = project(0, 0, 0);
        ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.2) {
          const ptRing = project(Math.cos(a + tick * 0.05) * 35, 0, Math.sin(a + tick * 0.05) * 35);
          if (a === 0) ctx.moveTo(ptRing.px, ptRing.py);
          else ctx.lineTo(ptRing.px, ptRing.py);
        }
        ctx.stroke();

        ctx.fillStyle = "#c084fc";
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [target, isRotating]);

  return (
    <div className="relative w-full bg-slate-950/80 rounded-xl border border-cyan-900/40 p-3 overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.1)]">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800/80 text-xs">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-mono-code">
          <Orbit className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
          <span className="font-semibold tracking-wider">3D CELESTIAL TARGET PROJECTION</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="p-1 text-slate-400 hover:text-cyan-300 rounded transition-colors text-[10px] flex items-center space-x-1"
            title="Toggle Auto Rotation"
          >
            <RotateCw className={`w-3 h-3 ${isRotating ? "animate-spin-slow text-cyan-400" : ""}`} />
            <span>{isRotating ? "Auto-Rot" : "Paused"}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-44 rounded-lg block" />
        <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-mono-code pointer-events-none">
          Click & Drag to Rotate 3D Axis
        </div>
      </div>
    </div>
  );
}
