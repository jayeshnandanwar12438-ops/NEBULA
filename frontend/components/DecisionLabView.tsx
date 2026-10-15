"use client";

import React, { useState } from "react";
import { evaluateDecisionLab, ToolDecisionResult } from "@/lib/api";
import {
  FlaskConical,
  Play,
  Cpu,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const PRESET_STATES = [
  {
    title: "Unverified Brightening Spike",
    state:
      "INVESTIGATION STEP 1/4. TARGET: Object-Alert-01. Object appeared with sudden 3.5 magnitude rise. Image quality flags, cosmic ray contamination, and detector artifacts are UNVERIFIED. No tools have run yet.",
  },
  {
    title: "Clean Quality Seeking Astrometry",
    state:
      "INVESTIGATION STEP 2/4. TARGET: Asteroid-Candidate. Photometry showed moderate flux rise. Quality flags confirmed clean (0x0000, PSF chi2 = 1.05). Right Ascension and Declination shifts across epochs have NOT been evaluated.",
  },
  {
    title: "Approaching Investigation Ceiling",
    state:
      "INVESTIGATION STEP 4/4. TARGET: Multi-Epoch-Blazar. Completed tools: [check_quality, compare_epochs, track_motion]. Maximum step ceiling reached. Synthesize findings or request follow-up observations.",
  },
];

const ALL_CANDIDATE_TOOLS = [
  { id: "compare_epochs", label: "compare_epochs", desc: "Compare brightness and flux across observation epochs." },
  { id: "track_motion", label: "track_motion", desc: "Analyze celestial coordinates (RA/Dec) for proper motion." },
  { id: "check_quality", label: "check_quality", desc: "Evaluate detector flags, cosmic rays, and PSF residuals." },
  { id: "request_more_data", label: "request_more_data", desc: "Request additional observational data or conclude." },
];

export default function DecisionLabView() {
  const [stateText, setStateText] = useState(PRESET_STATES[0].state);
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "compare_epochs",
    "track_motion",
    "check_quality",
    "request_more_data",
  ]);
  const [threshold, setThreshold] = useState(0.40);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ToolDecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTool = (id: string) => {
    if (selectedTools.includes(id)) {
      if (selectedTools.length > 2) {
        setSelectedTools(selectedTools.filter((t) => t !== id));
      }
    } else {
      setSelectedTools([...selectedTools, id]);
    }
  };

  const handleEvaluate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await evaluateDecisionLab({
        state: stateText,
        candidate_actions: selectedTools,
        confidence_threshold: threshold,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate decision");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 shadow-lg">
        <div className="flex items-center space-x-2.5 text-xs uppercase font-mono text-cyan-400 font-semibold mb-1">
          <FlaskConical className="w-4 h-4" />
          System One Inference Laboratory
        </div>
        <h2 className="text-lg font-bold text-slate-100">
          Strands Decider 2B Interactive Playground
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Test the discrete pointer-head decision engine in isolation. Pass arbitrary astronomical state
          prompts, configure candidate tool subsets, and observe single-pass inference latency, calibrated
          probabilities, and fallback behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input State & Candidate Configuration */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-semibold">
                  Astronomical State Description
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Input Tokens ~{Math.round(stateText.length / 4)}
                </span>
              </div>
              <textarea
                value={stateText}
                onChange={(e) => setStateText(e.target.value)}
                rows={5}
                className="w-full bg-space-950 border border-space-800 focus:border-cyan-500 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                placeholder="Type or paste astronomical investigation state..."
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">Presets:</span>
              {PRESET_STATES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setStateText(p.state)}
                  className="text-[11px] bg-space-850 hover:bg-space-800 text-slate-300 border border-space-750 px-2.5 py-1 rounded transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Candidate Tools Checkboxes */}
            <div className="pt-2 border-t border-space-800">
              <label className="text-xs font-mono uppercase text-slate-300 font-semibold block mb-2">
                Candidate Tool Choices ({selectedTools.length} Active)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ALL_CANDIDATE_TOOLS.map((tool) => {
                  const isChecked = selectedTools.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                        isChecked
                          ? "bg-cyan-500/10 border-cyan-500/40 text-slate-100"
                          : "bg-space-950 border-space-800 text-slate-500 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-cyan-400"
                        />
                        <span className="font-mono font-bold text-xs">{tool.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 pl-5">{tool.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confidence Safety Threshold Slider */}
            <div className="pt-2 border-t border-space-800">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Confidence Safety Floor:</span>
                <span className="text-cyan-400 font-bold">{(threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Run Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleEvaluate}
                disabled={isLoading || !stateText.trim()}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-space-950 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-950/60"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-space-950 border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Evaluate Forward Pass</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Decider 2B Output & Diagnostics */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="bg-rose-950/30 border border-rose-800/60 p-4 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {result ? (
            <div className="bg-space-900 border border-cyan-500/40 rounded-xl p-5 shadow-lg shadow-cyan-950/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-space-800">
                <span className="text-xs font-mono font-semibold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  Decision Result
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                    result.is_real_decider
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {result.is_real_decider ? "REAL DECIDER 2B" : "SAFE FALLBACK"}
                </span>
              </div>

              {/* Selected Action Card */}
              <div className="bg-space-950 p-4 rounded-lg border border-space-800 text-center space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-mono">
                  Selected Action
                </div>
                <div className="text-base font-mono font-bold text-cyan-300">
                  {result.selected_action}
                </div>
                <div className="text-xs text-slate-400 mt-1">{result.reason}</div>
              </div>

              {/* Latency & Confidence Telemetry */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                  <div className="text-[10px] text-slate-500 uppercase">Model Confidence</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {result.confidence !== null ? `${(result.confidence * 100).toFixed(1)}%` : "N/A (Fallback)"}
                  </div>
                </div>
                <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                  <div className="text-[10px] text-slate-500 uppercase">Forward Pass Latency</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {result.latency_ms.toFixed(1)}ms
                  </div>
                </div>
              </div>

              {/* Probability Distribution */}
              {Object.keys(result.probabilities).length > 0 && (
                <div className="bg-space-950 p-3.5 rounded-lg border border-space-800 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-mono flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan-400" />
                    Pointer-Head Calibrated Probabilities
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(result.probabilities).map(([act, prob]) => {
                      const isChosen = act === result.selected_action;
                      return (
                        <div key={act} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={isChosen ? "text-cyan-300 font-bold" : "text-slate-400"}>
                              {act}
                            </span>
                            <span className={isChosen ? "text-cyan-300 font-bold" : "text-slate-500"}>
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-space-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isChosen ? "bg-cyan-400" : "bg-space-700"
                              }`}
                              style={{ width: `${Math.max(prob * 100, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Decision Provenance */}
              <div className="text-[11px] text-slate-500 font-mono">
                Source: {result.decision_source}
              </div>
            </div>
          ) : (
            <div className="bg-space-900 border border-space-700/60 rounded-xl p-8 text-center text-slate-500 text-xs">
              <Cpu className="w-7 h-7 mx-auto text-slate-600 mb-2" />
              Configure parameters and click &apos;Evaluate Forward Pass&apos; to inspect Decider 2B inference.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
