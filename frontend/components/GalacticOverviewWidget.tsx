"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Orbit,
  Sparkles,
  Layers,
  Compass,
  Activity,
  Globe,
  Radio,
  BarChart2,
  PieChart,
} from "lucide-react";

export default function GalacticOverviewWidget() {
  const galaxyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [displayMode, setDisplayMode] = useState<"density" | "velocity">("density");
  const [selectedSpectrum, setSelectedSpectrum] = useState<string>("M");

  // ============================================================================
  // 1. 3D Whirlpool / Spiral Galaxy Simulation (Inspired by Reference Images 1 & 2)
  // ============================================================================
  useEffect(() => {
    const canvas = galaxyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = 260);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 260;
    };
    window.addEventListener("resize", handleResize);

    // Generate 900 spiral arm stars using logarithmic spiral formula: r = a * exp(b * theta)
    const STAR_COUNT = 900;
    const galaxyStars: {
      r: number;
      theta: number;
      armOffset: number;
      size: number;
      color: string;
      speed: number;
    }[] = [];

    const colors = [
      "rgba(147, 197, 253, ", // Pale blue
      "rgba(199, 210, 254, ", // Violet
      "rgba(254, 240, 138, ", // Pale gold
      "rgba(255, 255, 255, ", // Pure white
      "rgba(103, 232, 249, ", // Electric cyan
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      const arm = (i % 2) * Math.PI; // 2 main spiral arms
      const r = Math.pow(Math.random(), 1.6) * 110 + 6;
      const theta = r * 0.055 + arm + (Math.random() - 0.5) * 0.45;
      const size = Math.random() * 1.5 + 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Keplerian-like differential rotation
      const speed = 0.007 / Math.sqrt(r * 0.035 + 0.3);

      galaxyStars.push({ r, theta, armOffset: arm, size, color, speed });
    }

    let angle = 0;

    const renderGalaxy = () => {
      angle += 0.004;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw brilliant galactic core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 45);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      coreGrad.addColorStop(0.2, "rgba(254, 240, 138, 0.7)");
      coreGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.25)");
      coreGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fill();

      // Render rotating logarithmic spiral stars
      galaxyStars.forEach((star) => {
        star.theta += star.speed;

        // Project elliptical inclination tilt (~55 degrees like Whirlpool galaxy)
        const tiltY = 0.58;
        const x = cx + Math.cos(star.theta) * star.r;
        const y = cy + Math.sin(star.theta) * star.r * tiltY;

        const alpha = Math.min(1, 0.3 + (1 - star.r / 120) * 0.7);

        ctx.fillStyle = `${star.color}${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // If Velocity Vector Field is active, draw velocity tails (Image 1 style)
        if (displayMode === "velocity") {
          const vx = -Math.sin(star.theta) * star.speed * 450;
          const vy = Math.cos(star.theta) * star.speed * 450 * tiltY;
          ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx, y + vy);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(renderGalaxy);
    };

    renderGalaxy();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [displayMode]);

  // ============================================================================
  // 2. Gaia Astrometric Mission Heliocentric Orbit (Inspired by Reference Image 1)
  // ============================================================================
  useEffect(() => {
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = 200);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 200;
    };
    window.addEventListener("resize", handleResize);

    let orbitTick = 0;

    const renderOrbit = () => {
      orbitTick += 0.02;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw Heliocentric Sun
      const sunGrad = ctx.createRadialGradient(cx - 35, cy, 2, cx - 35, cy, 18);
      sunGrad.addColorStop(0, "rgba(254, 240, 138, 1)");
      sunGrad.addColorStop(0.5, "rgba(251, 146, 60, 0.6)");
      sunGrad.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx - 35, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(cx - 35, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(254, 240, 138, 0.8)";
      ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("Sun", cx - 35 - 8, cy - 10);

      // 2. Earth Elliptical Orbit
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 95, 45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Earth Position
      const earthAngle = orbitTick * 0.4;
      const earthX = cx + Math.cos(earthAngle) * 95;
      const earthY = cy + Math.sin(earthAngle) * 45;

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(earthX, earthY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
      ctx.fillText("Earth", earthX + 8, earthY + 3);

      // 4. Gaia / Satellite L2 Halo Orbit around Earth
      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(earthX + 15, earthY, 20, 12, 0.2, 0, Math.PI * 2);
      ctx.stroke();

      const satAngle = orbitTick * 1.6;
      const satX = earthX + 15 + Math.cos(satAngle) * 20;
      const satY = earthY + Math.sin(satAngle) * 12;

      ctx.fillStyle = "#ec4899";
      ctx.beginPath();
      ctx.arc(satX, satY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing telemetry ping
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
      ctx.beginPath();
      ctx.arc(satX, satY, 6 + (Math.sin(orbitTick * 4) + 1) * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#f472b6";
      ctx.fillText("Gaia / L2", satX + 6, satY - 4);

      animId = requestAnimationFrame(renderOrbit);
    };

    renderOrbit();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ============================================================================
  // 3. Gravitational Wave & Accretion Oscilloscope Wave (Images 1 & 2)
  // ============================================================================
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = 80);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 80;
    };
    window.addEventListener("resize", handleResize);

    let waveTick = 0;

    const renderWave = () => {
      waveTick += 0.05;
      ctx.clearRect(0, 0, width, height);

      const midY = height / 2;

      // Background grid line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Waveform: Chirp / Gravitational wave oscillation
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let x = 0; x < width; x += 2) {
        // Center chirp resonance
        const normX = (x / width) * 2 - 1; // -1 to 1
        const envelope = Math.exp(-normX * normX * 4); // Gaussian peak
        const freq = 12 + envelope * 18;
        const y = midY + Math.sin(x * 0.08 * freq - waveTick * 4) * (envelope * 28 + 3);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Star spectral classes data (Direct from Reference Image 2)
  const spectralData = [
    { type: "O", color: "#38bdf8", pct: "0.2%", count: "1,284", height: 18 },
    { type: "B", color: "#60a5fa", pct: "0.8%", count: "6.8%", height: 26 },
    { type: "A", color: "#facc15", pct: "3.2%", count: "3.9%", height: 38 },
    { type: "F", color: "#fb923c", pct: "7.5%", count: "7.9%", height: 52 },
    { type: "G", color: "#f97316", pct: "14.2%", count: "12.4%", height: 68 },
    { type: "M", color: "#ef4444", pct: "52.4%", count: "50%+", height: 96 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row: Galaxy Simulation + Gaia Astrometry Orbit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel A: 3D Whirlpool Galaxy (Inspired by Image 1 & 2) */}
        <div className="lg:col-span-7 glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <h3 className="text-sm font-bold text-slate-100 tracking-wide font-mono flex items-center gap-1.5">
                <span>MS1: Whirlpool Galaxy</span>
                <span className="text-xs text-cyan-400 font-normal">v2.1</span>
              </h3>
            </div>

            {/* Toggle buttons like Image 1 */}
            <div className="flex items-center space-x-1 glass-pill p-1 text-[11px] font-mono">
              <button
                onClick={() => setDisplayMode("density")}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  displayMode === "density"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Star Density (pc³)
              </button>
              <button
                onClick={() => setDisplayMode("velocity")}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  displayMode === "velocity"
                    ? "bg-violet-500/25 text-violet-300 border border-violet-500/40 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Velocity Vector Field
              </button>
            </div>
          </div>

          {/* Interactive Galaxy Canvas */}
          <div className="relative py-2">
            <canvas ref={galaxyCanvasRef} className="w-full h-56 rounded-xl block" />

            {/* In-Canvas Telemetry Overlay (Image 2 style) */}
            <div className="absolute bottom-3 right-3 glass-panel p-2.5 text-[10px] font-mono space-y-1 text-slate-300 border border-white/[0.08] backdrop-blur-md">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Observable Stars:</span>
                <span className="text-cyan-300 font-bold">250 Billion</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Known Exoplanets:</span>
                <span className="text-violet-300 font-bold">5,032</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Black Holes:</span>
                <span className="text-amber-300 font-bold">78,340</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel B: Gaia Astrometric Mission Orbit (Inspired by Image 1) */}
        <div className="lg:col-span-5 glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <Orbit className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
                GAIA ASTROMETRIC MISSION
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 glass-pill px-2 py-0.5">
              Heliocentric
            </span>
          </div>

          {/* 3D Orbit Canvas */}
          <div className="relative py-1">
            <canvas ref={orbitCanvasRef} className="w-full h-44 rounded-xl block" />
          </div>

          {/* Telemetry Readout */}
          <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/[0.06] text-slate-400">
            <div>
              ALT: <span className="text-cyan-300 font-bold">1.5M km</span>
            </div>
            <div>
              VEL: <span className="text-emerald-400 font-bold">2.1 km/s</span>
            </div>
            <div className="text-[11px] text-pink-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              L2 LAGRANGE BEACON
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Spectral Classification + Exoplanet Donut + Gravitational Waveform */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Star Classification Distribution (O B A F G M) - Image 2 */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              Star Classification Distribution
            </h4>
            <span className="text-[10px] font-mono text-slate-400">O B A F G M</span>
          </div>

          {/* Glowing Spectral Bars */}
          <div className="flex items-end justify-between h-36 pt-4 px-2">
            {spectralData.map((spec) => (
              <div
                key={spec.type}
                onClick={() => setSelectedSpectrum(spec.type)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-100">
                  {spec.pct}
                </div>
                <div className="w-8 bg-slate-900/60 rounded-t-lg overflow-hidden flex items-end h-24 border border-white/[0.06]">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                    style={{
                      height: `${spec.height}%`,
                      backgroundColor: spec.color,
                      boxShadow: `0 0 16px ${spec.color}66`,
                    }}
                  />
                </div>
                <div
                  className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                    selectedSpectrum === spec.type
                      ? "bg-white/20 text-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      : "text-slate-400"
                  }`}
                >
                  {spec.type}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono text-xs">
            <div className="glass-pill p-2">
              <div className="text-[10px] text-slate-400">Habitable Zone</div>
              <div className="text-sm font-bold text-cyan-300">1,284</div>
            </div>
            <div className="glass-pill p-2">
              <div className="text-[10px] text-slate-400">Earth-Like</div>
              <div className="text-sm font-bold text-emerald-300">189</div>
            </div>
            <div className="glass-pill p-2">
              <div className="text-[10px] text-slate-400">Supernovae / 30d</div>
              <div className="text-sm font-bold text-rose-300">14</div>
            </div>
          </div>
        </div>

        {/* Exoplanet Detection Methods Donut Stats - Image 2 */}
        <div className="lg:col-span-3 glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-violet-400" />
              Exoplanet Discovery
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Method</span>
          </div>

          {/* Donut representation */}
          <div className="space-y-2.5 font-mono text-xs py-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                Transit
              </span>
              <span className="font-bold text-amber-300">65%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                Radial Velocity
              </span>
              <span className="font-bold text-rose-300">22%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                Microlensing
              </span>
              <span className="font-bold text-violet-300">8%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                Direct Imaging
              </span>
              <span className="font-bold text-cyan-300">5%</span>
            </div>
          </div>

          <div className="p-2.5 glass-pill text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Primary Sensor:</span>
            <span className="text-cyan-300 font-bold">Space Photometer</span>
          </div>
        </div>

        {/* Gravitational Wave GW180814 / Accretion Waveform - Images 1 & 2 */}
        <div className="lg:col-span-4 glass-panel p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              GRAVITATIONAL WAVE GW180814
            </h4>
            <span className="text-[10px] font-mono text-cyan-400 glass-pill px-2 py-0.5">
              Peak Frequency
            </span>
          </div>

          <div className="relative py-1">
            <canvas ref={waveCanvasRef} className="w-full h-20 rounded-lg block" />
            <div className="absolute top-1 right-2 text-[9px] font-mono text-cyan-300">
              +1,870 MJ/s
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
            <span>Black Hole Chirp: <span className="text-slate-200 font-bold">53 Mly</span></span>
            <span className="text-emerald-400 font-bold">SNR = 18.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
