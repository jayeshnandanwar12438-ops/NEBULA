"use client";

import React, { useState } from "react";
import { AstronomicalTarget } from "@/lib/api";
import {
  Play,
  Sliders,
  Sparkles,
  Info,
  Orbit,
  Crosshair,
} from "lucide-react";

interface InvestigationPanelProps {
  targets: AstronomicalTarget[];
  selectedTargetId: string;
  onSelectTarget: (id: string) => void;
  userQuery: string;
  onChangeQuery: (q: string) => void;
  maxSteps: number;
  onChangeMaxSteps: (s: number) => void;
  confidenceThreshold: number;
  onChangeThreshold: (t: number) => void;
  isInvestigating: boolean;
  onLaunchInvestigation: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Transient vs Asteroid vs Artifact",
    prompt:
      "An astronomical object became significantly brighter between two observations. Determine whether the evidence suggests a transient event, a moving object, or a possible measurement artifact.",
  },
  {
    title: "Verify Fast Proper Motion",
    prompt:
      "The source exhibited an apparent flux rise near the ecliptic plane. Track celestial coordinates to determine if proper motion indicates a Near-Earth Asteroid.",
  },
  {
    title: "Screen for Detector Glitch",
    prompt:
      "A 3.5-magnitude spike was detected in a single epoch. Inspect quality bitmasks and PSF fitting chi-squared to rule out a cosmic ray strike.",
  },
];

export default function InvestigationPanel({
  targets,
  selectedTargetId,
  onSelectTarget,
  userQuery,
  onChangeQuery,
  maxSteps,
  onChangeMaxSteps,
  confidenceThreshold,
  onChangeThreshold,
  isInvestigating,
  onLaunchInvestigation,
}: InvestigationPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeTarget = targets.find((t) => t.target_id === selectedTargetId);

  return (
    <div className="glass-panel p-6 space-y-5 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Target Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-mono uppercase text-cyan-300 font-semibold tracking-wider flex items-center gap-1.5">
            <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>Select Target (Deterministic Synthetic Datasets)</span>
          </label>
          <span className="text-[11px] font-mono text-slate-400 glass-pill px-2.5 py-0.5">
            {targets.length} Targets Cataloged
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {targets.map((target) => {
            const isSelected = target.target_id === selectedTargetId;
            return (
              <button
                key={target.target_id}
                onClick={() => onSelectTarget(target.target_id)}
                disabled={isInvestigating}
                className={`p-3.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? "bg-gradient-to-b from-cyan-500/25 to-blue-600/15 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] scale-[1.02]"
                    : "glass-card-interactive"
                } ${isInvestigating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1">
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                    {target.target_id}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-white/[0.08] text-slate-300">
                    {target.epochs.length} Ep
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 line-clamp-1 font-sans">
                  {target.name.replace("Synthetic Anomaly ", "")}
                </div>
                <div className="text-[9px] font-mono text-cyan-400 mt-1 uppercase font-semibold">
                  {target.expected_classification.replace("_", " ")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Description Summary Callout */}
      {activeTarget && (
        <div className="glass-card-interactive p-3.5 rounded-xl flex items-start space-x-3 text-xs text-slate-300 border border-white/[0.08]">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-100 font-mono">
              [SYNTHETIC BENCHMARK] {activeTarget.name}:
            </span>{" "}
            <span className="text-slate-300">{activeTarget.description}</span>{" "}
            <span className="text-[11px] text-slate-400 block font-mono">
              Astrometry / Cadence: {activeTarget.discovery_notes}
            </span>
          </div>
        </div>
      )}

      {/* Query Input Box */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono uppercase text-slate-200 font-semibold tracking-wider flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Investigation Scientific Query Prompt</span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            Bedrock Reasoning + Strands Decider 2B Execution
          </span>
        </div>
        <textarea
          value={userQuery}
          onChange={(e) => onChangeQuery(e.target.value)}
          disabled={isInvestigating}
          rows={3}
          className="w-full glass-input p-3.5 text-sm text-slate-100 placeholder-slate-500 transition-all resize-none font-sans"
          placeholder="State the astronomical observation question or anomaly hypothesis to investigate..."
        />
      </div>

      {/* Example Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Quick Prompts:
        </span>
        {EXAMPLE_PROMPTS.map((ex, i) => (
          <button
            key={i}
            onClick={() => onChangeQuery(ex.prompt)}
            disabled={isInvestigating}
            className="text-[11px] glass-pill px-3 py-1 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all font-sans hover:scale-[1.02]"
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Advanced Parameters Toggle */}
      <div className="pt-2 border-t border-white/[0.08]">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 font-mono transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          {showAdvanced ? "Hide Autonomous Agent Parameters" : "Configure Agent Loop Parameters"}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 glass-card-interactive text-xs border border-white/[0.08]">
            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1.5">
                <span>Maximum Investigation Steps (Ceiling):</span>
                <span className="text-cyan-400 font-bold">{maxSteps} Steps</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                value={maxSteps}
                onChange={(e) => onChangeMaxSteps(parseInt(e.target.value))}
                disabled={isInvestigating}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Prevents infinite decision loops; safely caps analysis iterations.
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1.5">
                <span>Decider 2B Confidence Threshold:</span>
                <span className="text-cyan-400 font-bold">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={confidenceThreshold}
                onChange={(e) => onChangeThreshold(parseFloat(e.target.value))}
                disabled={isInvestigating}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Decisions below this calibrated score trigger transparent safety triage.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Launch Action Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={onLaunchInvestigation}
          disabled={isInvestigating || !selectedTargetId}
          className={`flex items-center space-x-2.5 px-7 py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-xl ${
            isInvestigating
              ? "bg-cyan-950/70 text-cyan-400/60 border border-cyan-800/60 cursor-wait"
              : "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-slate-950 border border-cyan-300/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {isInvestigating ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Decider 2B Investigating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Autonomous Investigation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
