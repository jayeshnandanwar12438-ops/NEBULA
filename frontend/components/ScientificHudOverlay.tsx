"use client";

import React, { useEffect, useState } from "react";
import { Radio, Activity, Orbit, ShieldCheck, Crosshair, Cpu } from "lucide-react";

interface ScientificHudOverlayProps {
  activeTargetName?: string;
  isInvestigating?: boolean;
}

export default function ScientificHudOverlay({
  activeTargetName = "SN-2026-X1",
  isInvestigating = false,
}: ScientificHudOverlayProps) {
  const [telemetry, setTelemetry] = useState({
    ra: "14h 29m 42.95s",
    dec: "-62° 40' 46.1\"",
    flux: 623.5,
    photonRate: 48920,
    seeing: 0.68,
    temp: -80.2,
  });

  // Simulate real-time scientific telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        photonRate: Math.floor(48000 + Math.random() * 1800),
        seeing: +(0.65 + Math.random() * 0.08).toFixed(2),
        temp: +(-80.0 - Math.random() * 0.5).toFixed(1),
        flux: +(prev.flux + (Math.random() - 0.5) * 1.2).toFixed(1),
      }));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-950/70 border-b border-cyan-900/30 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono-code relative overflow-hidden">
      {/* Subtle top laser scan line animation */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent animate-laser-scan" />

      {/* Left: Active Radar Sweep & Target Reticle */}
      <div className="flex items-center space-x-4">
        {/* Radar Scanner Mini-Disc */}
        <div className="relative w-8 h-8 rounded-full border border-cyan-500/40 bg-slate-900/90 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          {/* Radar grid crosshair */}
          <div className="absolute inset-0 border-t border-b border-cyan-500/20 top-1/2 -translate-y-1/2" />
          <div className="absolute inset-0 border-l border-r border-cyan-500/20 left-1/2 -translate-x-1/2" />
          <div className="absolute inset-1 rounded-full border border-cyan-500/10" />

          {/* Rotating radar sweep beam */}
          <div className="absolute inset-0 origin-center animate-radar-sweep bg-gradient-to-tr from-transparent via-transparent to-cyan-400/40" />

          {/* Target blip */}
          <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full top-2 right-2 animate-ping" />
          <div className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full top-2 right-2" />
        </div>

        {/* Target coordinates and lock status */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center">
              <Crosshair className="w-3 h-3 mr-1 animate-spin-slow text-cyan-400" />
              Target Lock:
            </span>
            <span className="text-slate-100 font-bold bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/30 text-[11px]">
              {activeTargetName}
            </span>
            {isInvestigating && (
              <span className="flex items-center space-x-1 text-amber-400 text-[10px] animate-pulse bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>DECIDER INFERENCE ACTIVE</span>
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 space-x-2 mt-0.5">
            <span>RA: <span className="text-cyan-200">{telemetry.ra}</span></span>
            <span className="text-slate-600">|</span>
            <span>DEC: <span className="text-cyan-200">{telemetry.dec}</span></span>
          </div>
        </div>
      </div>

      {/* Center: Spectroscopic Wavelength Fluctuations (Equalizer Visualizer) */}
      <div className="hidden lg:flex items-center space-x-3 px-3 py-1 bg-slate-900/60 rounded-md border border-slate-800/80">
        <div className="flex items-center space-x-1">
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] text-violet-300 font-semibold uppercase">SPECTRA FLUX</span>
        </div>
        <div className="flex items-end space-x-1 h-4">
          {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 60, 50].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-500 via-violet-500 to-fuchsia-400 rounded-t-sm"
              style={{
                height: `${isInvestigating ? Math.min(100, h * 1.2) : h}%`,
                animation: `pulse 1.${(i % 5) + 3}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
        <span className="text-[11px] text-slate-200 font-bold ml-1">{telemetry.flux} µJy</span>
      </div>

      {/* Right: Optical Bench Telemetry */}
      <div className="flex items-center space-x-4 text-[11px]">
        <div className="hidden sm:flex items-center space-x-1.5">
          <span className="text-slate-400">CCD TEMP:</span>
          <span className="text-cyan-300 font-bold">{telemetry.temp}°C</span>
        </div>
        <div className="hidden md:flex items-center space-x-1.5">
          <span className="text-slate-400">SEEING:</span>
          <span className="text-emerald-400 font-bold">{telemetry.seeing}&quot;</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-800/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">PHOTONS:</span>
          <span className="text-cyan-200 font-bold">{telemetry.photonRate.toLocaleString()} ph/s</span>
        </div>
      </div>
    </div>
  );
}
