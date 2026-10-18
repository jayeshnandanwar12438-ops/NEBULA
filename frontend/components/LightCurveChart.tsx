"use client";

import React, { useState } from "react";
import { ObservationEpoch } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  Area,
} from "recharts";
import { Sparkles, Orbit, Activity } from "lucide-react";

interface LightCurveChartProps {
  epochs: ObservationEpoch[];
  targetName: string;
}

export default function LightCurveChart({ epochs, targetName }: LightCurveChartProps) {
  const [chartMode, setChartMode] = useState<"flux" | "magnitude" | "astrometry">("flux");

  if (!epochs || epochs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center glass-panel text-slate-500 text-sm">
        No observational epoch data available.
      </div>
    );
  }

  // Format photometric data
  const photoData = epochs.map((ep) => ({
    name: ep.epoch_id,
    time: new Date(ep.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    flux: ep.flux_ujy,
    fluxErr: ep.flux_err_ujy,
    mag: ep.magnitude,
    magErr: ep.magnitude_err,
    snr: ep.snr,
    band: ep.filter_band,
    telescope: ep.telescope_id,
  }));

  // Format astrometric coordinates (relative delta in arcseconds from epoch 1)
  const baseRa = epochs[0].ra_deg;
  const baseDec = epochs[0].dec_deg;
  const cosDec = Math.cos((baseDec * Math.PI) / 180.0);

  const astrometryData = epochs.map((ep) => {
    const dRaArcsec = (ep.ra_deg - baseRa) * cosDec * 3600.0;
    const dDecArcsec = (ep.dec_deg - baseDec) * 3600.0;
    return {
      epoch: ep.epoch_id,
      raOffset: parseFloat(dRaArcsec.toFixed(3)),
      decOffset: parseFloat(dDecArcsec.toFixed(3)),
      raDeg: ep.ra_deg,
      decDeg: ep.dec_deg,
      posErr: ep.position_err_arcsec,
    };
  });

  return (
    <div className="glass-panel p-6 shadow-2xl relative overflow-hidden border border-white/[0.08]">
      {/* Top subtle glow bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* Header & Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Empirical Observational Diagnostics
          </div>
          <div className="text-sm font-semibold text-slate-100 mt-0.5 font-sans">
            {targetName} ({epochs.length} Epoch{epochs.length > 1 ? "s" : ""})
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center glass-pill p-1 text-xs font-mono">
          <button
            onClick={() => setChartMode("flux")}
            className={`px-3 py-1 rounded-full transition-all ${
              chartMode === "flux"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Flux (μJy)
          </button>
          <button
            onClick={() => setChartMode("magnitude")}
            className={`px-3 py-1 rounded-full transition-all ${
              chartMode === "magnitude"
                ? "bg-violet-500/25 text-violet-300 border border-violet-400/40 shadow-[0_0_10px_rgba(139,92,246,0.3)] font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Magnitude (AB)
          </button>
          <button
            onClick={() => setChartMode("astrometry")}
            className={`px-3 py-1 rounded-full transition-all ${
              chartMode === "astrometry"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Astrometry (Δα*, Δδ)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {chartMode === "flux" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={photoData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fluxGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                fontFamily="monospace"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `${val} μJy`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 16, 32, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="flux"
                name="Calibrated Flux (μJy)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 5, fill: "#38bdf8", stroke: "#030611", strokeWidth: 2 }}
                activeDot={{ r: 8, stroke: "#38bdf8", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartMode === "magnitude" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={photoData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontFamily="monospace" />
              {/* Inverted magnitude axis: lower magnitude = brighter */}
              <YAxis
                reversed
                stroke="#94a3b8"
                fontSize={11}
                fontFamily="monospace"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `${val}m`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 16, 32, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="mag"
                name="Apparent Magnitude"
                stroke="#c084fc"
                strokeWidth={3}
                dot={{ r: 5, fill: "#c084fc", stroke: "#030611", strokeWidth: 2 }}
                activeDot={{ r: 8, stroke: "#c084fc", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartMode === "astrometry" && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                type="number"
                dataKey="raOffset"
                name="ΔRA cos(Dec)"
                unit="″"
                stroke="#94a3b8"
                fontSize={11}
                fontFamily="monospace"
              />
              <YAxis
                type="number"
                dataKey="decOffset"
                name="ΔDec"
                unit="″"
                stroke="#94a3b8"
                fontSize={11}
                fontFamily="monospace"
              />
              <ZAxis type="number" range={[100, 250]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "rgba(10, 16, 32, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  fontFamily: "monospace",
                }}
              />
              <Scatter
                name="Centroid Offset"
                data={astrometryData}
                fill="#34d399"
                line={{ stroke: "#10b981", strokeWidth: 2 }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Epochs Data Table Mini */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
        {epochs.slice(0, 4).map((ep) => (
          <div key={ep.epoch_id} className="glass-card-interactive p-2.5 rounded-xl border border-white/[0.06]">
            <div className="text-slate-300 font-semibold flex items-center justify-between">
              <span>{ep.epoch_id} ({ep.filter_band})</span>
              <span className="text-cyan-300 font-bold">{ep.magnitude.toFixed(2)}m</span>
            </div>
            <div className="text-slate-400 mt-1 flex justify-between">
              <span>Flux: {ep.flux_ujy.toFixed(1)} μJy</span>
              <span>SNR: {ep.snr.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
