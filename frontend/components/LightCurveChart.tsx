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
} from "recharts";
import { Sparkles, Orbit, AlertCircle } from "lucide-react";

interface LightCurveChartProps {
  epochs: ObservationEpoch[];
  targetName: string;
}

export default function LightCurveChart({ epochs, targetName }: LightCurveChartProps) {
  const [chartMode, setChartMode] = useState<"flux" | "magnitude" | "astrometry">("flux");

  if (!epochs || epochs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-space-850/50 rounded-xl border border-space-700/60 text-slate-500 text-sm">
        No observational epoch data available.
      </div>
    );
  }

  // Format photometric data
  const photoData = epochs.map((ep, idx) => ({
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
    <div className="bg-space-900 border border-space-700/70 rounded-xl p-5 shadow-lg shadow-black/40">
      {/* Header & Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Empirical Observational Diagnostics
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5">
            {targetName} ({epochs.length} Epoch{epochs.length > 1 ? "s" : ""})
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-space-950 p-1 rounded-lg border border-space-800 text-xs font-mono">
          <button
            onClick={() => setChartMode("flux")}
            className={`px-3 py-1 rounded transition-colors ${
              chartMode === "flux"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Flux (μJy)
          </button>
          <button
            onClick={() => setChartMode("magnitude")}
            className={`px-3 py-1 rounded transition-colors ${
              chartMode === "magnitude"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Magnitude (AB)
          </button>
          <button
            onClick={() => setChartMode("astrometry")}
            className={`px-3 py-1 rounded transition-colors ${
              chartMode === "astrometry"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2742" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `${val} μJy`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1424",
                  borderColor: "#273863",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="flux"
                name="Calibrated Flux (μJy)"
                stroke="#00f0ff"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#00f0ff", stroke: "#090d19", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartMode === "magnitude" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={photoData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2742" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
              {/* Inverted magnitude axis: lower magnitude = brighter */}
              <YAxis
                reversed
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `${val}m`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1424",
                  borderColor: "#273863",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="mag"
                name="Apparent Magnitude"
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#a78bfa", stroke: "#090d19", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartMode === "astrometry" && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2742" />
              <XAxis
                type="number"
                dataKey="raOffset"
                name="ΔRA cos(Dec)"
                unit="″"
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
              />
              <YAxis
                type="number"
                dataKey="decOffset"
                name="ΔDec"
                unit="″"
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
              />
              <ZAxis type="number" range={[100, 250]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#0d1424",
                  borderColor: "#273863",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                  fontFamily: "monospace",
                }}
              />
              <Scatter
                name="Centroid Offset"
                data={astrometryData}
                fill="#34d399"
                line={{ stroke: "#10b981", strokeWidth: 1.5 }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Epochs Data Table Mini */}
      <div className="mt-4 pt-3 border-t border-space-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        {epochs.slice(0, 4).map((ep) => (
          <div key={ep.epoch_id} className="bg-space-950/60 p-2 rounded border border-space-800/80">
            <div className="text-slate-400 font-semibold flex items-center justify-between">
              <span>{ep.epoch_id} ({ep.filter_band})</span>
              <span className="text-cyan-400">{ep.magnitude.toFixed(2)}m</span>
            </div>
            <div className="text-slate-500 mt-1 flex justify-between">
              <span>Flux: {ep.flux_ujy.toFixed(1)} μJy</span>
              <span>SNR: {ep.snr.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
