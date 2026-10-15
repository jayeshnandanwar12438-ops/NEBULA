"use client";

import React, { useState } from "react";
import { AstronomicalTarget } from "@/lib/api";
import {
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
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
    <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 shadow-lg shadow-black/40 space-y-4">
      {/* Target Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
            Select Observation Target (Deterministic Synthetic Datasets)
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            {targets.length} Targets Cataloged
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {targets.map((target) => {
            const isSelected = target.target_id === selectedTargetId;
            return (
              <button
                key={target.target_id}
                onClick={() => onSelectTarget(target.target_id)}
                disabled={isInvestigating}
                className={`p-3 rounded-lg text-left transition-all border ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-950"
                    : "bg-space-950/70 border-space-800 hover:border-space-700 hover:bg-space-850"
                } ${isInvestigating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {target.target_id}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
                    {target.epochs.length} Ep
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {target.name.replace("Synthetic Anomaly ", "")}
                </div>
                <div className="text-[9px] font-mono text-cyan-500 mt-1 uppercase">
                  {target.expected_classification.replace("_", " ")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Description Summary Callout */}
      {activeTarget && (
        <div className="bg-space-950/80 border border-space-800 p-3 rounded-lg flex items-start space-x-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 font-mono">
              [SYNTHETIC OBSERVATION BENCHMARK] {activeTarget.name}:
            </span>{" "}
            <span className="text-slate-400">{activeTarget.description}</span>{" "}
            <span className="text-[11px] text-slate-500 block font-mono">
              Notes: {activeTarget.discovery_notes}
            </span>
          </div>
        </div>
      )}

      {/* Query Input Box */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono uppercase text-slate-300 font-semibold tracking-wider">
            Scientific Investigation Request Prompt
          </label>
          <span className="text-[11px] text-slate-500">
            Bedrock Generative Reasoning + Decider 2B Execution
          </span>
        </div>
        <textarea
          value={userQuery}
          onChange={(e) => onChangeQuery(e.target.value)}
          disabled={isInvestigating}
          rows={3}
          className="w-full bg-space-950 border border-space-800 focus:border-cyan-500 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors resize-none font-sans"
          placeholder="State the astronomical observation question or anomaly hypothesis to investigate..."
        />
      </div>

      {/* Example Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Quick Prompts:
        </span>
        {EXAMPLE_PROMPTS.map((ex, i) => (
          <button
            key={i}
            onClick={() => onChangeQuery(ex.prompt)}
            disabled={isInvestigating}
            className="text-[11px] bg-space-850 hover:bg-space-800 text-slate-300 hover:text-cyan-300 border border-space-700/60 px-2.5 py-1 rounded-md transition-colors"
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Advanced Parameters Toggle */}
      <div className="pt-2 border-t border-space-800">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          {showAdvanced ? "Hide Autonomous Agent Parameters" : "Configure Agent Loop Parameters"}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3.5 bg-space-950 rounded-lg border border-space-800 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1">
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
              <div className="text-[10px] text-slate-500 mt-1">
                Prevents infinite decision loops; safely caps analysis iterations.
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1">
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
              <div className="text-[10px] text-slate-500 mt-1">
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
          className={`flex items-center space-x-2.5 px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg ${
            isInvestigating
              ? "bg-cyan-950 text-cyan-400/50 border border-cyan-800 cursor-wait shadow-none"
              : "bg-cyan-500 hover:bg-cyan-400 text-space-950 border border-cyan-300 shadow-cyan-950/60 hover:shadow-cyan-500/20 active:translate-y-0.5"
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
