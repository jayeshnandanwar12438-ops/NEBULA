"use client";

import React, { useState } from "react";
import { ToolDecisionResult, ToolExecutionFinding } from "@/lib/api";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Wrench,
  HelpCircle,
  BarChart2,
} from "lucide-react";

interface DecisionTimelineProps {
  decisions: ToolDecisionResult[];
  toolResults: ToolExecutionFinding[];
}

export default function DecisionTimeline({ decisions, toolResults }: DecisionTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!decisions || decisions.length === 0) {
    return (
      <div className="bg-space-900 border border-space-700/60 rounded-xl p-8 text-center text-slate-500">
        <Cpu className="w-8 h-8 mx-auto text-slate-600 mb-2 animate-pulse" />
        <div className="text-sm">Awaiting first investigation step...</div>
        <div className="text-xs text-slate-600 mt-1">
          Strands Decider 2B will evaluate the state and select the next analysis tool.
        </div>
      </div>
    );
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Autonomous Decision Sequence ({decisions.length} Step{decisions.length > 1 ? "s" : ""})
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Powered by Strands Decider 2B (System One)
        </span>
      </div>

      <div className="space-y-3">
        {decisions.map((decision, idx) => {
          const matchingToolResult = toolResults.find((r) => r.step_number === decision.decision_number);
          const isExpanded = expandedIndex === idx;
          const isReal = decision.is_real_decider;
          const confPct = decision.confidence !== null ? (decision.confidence * 100).toFixed(1) : null;

          return (
            <div
              key={idx}
              className={`bg-space-900 border rounded-xl transition-all ${
                isExpanded
                  ? "border-cyan-500/50 shadow-md shadow-cyan-950/40"
                  : "border-space-700/70 hover:border-space-600"
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleExpand(idx)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-7 h-7 rounded-lg bg-space-850 border border-space-700 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 shrink-0">
                    #{decision.decision_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-100 bg-space-950 px-2 py-0.5 rounded border border-space-800">
                        {decision.selected_action}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          isReal
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isReal ? "REAL DECIDER 2B" : "SAFE FALLBACK"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {decision.reason}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  {/* Calibrated Confidence Badge */}
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">
                      Decider Confidence
                    </div>
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      {confPct !== null ? `${confPct}%` : "N/A (Fallback)"}
                    </div>
                  </div>

                  {/* Latency */}
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Latency</div>
                    <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {decision.latency_ms.toFixed(1)}ms
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expandable Decision Diagnostics */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-space-800/80 space-y-3.5 text-xs">
                  {/* Typed Question & Model Provenance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                      <div className="text-[10px] text-slate-500 uppercase font-mono mb-1 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-cyan-400" />
                        Typed Question Prompt
                      </div>
                      <div className="text-slate-200 text-xs leading-relaxed">
                        {decision.typed_question}
                      </div>
                    </div>

                    <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                      <div className="text-[10px] text-slate-500 uppercase font-mono mb-1 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-violet-400" />
                        Inference Provenance
                      </div>
                      <div className="text-slate-300 font-mono text-xs">
                        {decision.decision_source}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Latency: {decision.latency_ms.toFixed(2)}ms | Status: {decision.status}
                      </div>
                    </div>
                  </div>

                  {/* Candidate Actions Probability Distribution */}
                  <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono mb-2 flex items-center gap-1">
                      <BarChart2 className="w-3 h-3 text-cyan-400" />
                      Candidate Action Probabilities (Single Forward Pass)
                    </div>
                    <div className="space-y-1.5">
                      {decision.candidate_actions.map((act) => {
                        const prob = decision.probabilities[act] || 0;
                        const isSelected = act === decision.selected_action;
                        return (
                          <div key={act} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-400"}>
                                {act} {isSelected ? "(Selected)" : ""}
                              </span>
                              <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-500"}>
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-space-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isSelected ? "bg-cyan-400" : "bg-space-700"
                                }`}
                                style={{ width: `${Math.max(prob * 100, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Investigation State Snapshot Provided to Decider */}
                  <div className="bg-space-950/60 p-3 rounded-lg border border-space-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                      Investigation State Input
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                      {decision.investigation_state_input}
                    </div>
                  </div>

                  {/* Executed Tool Result */}
                  {matchingToolResult && (
                    <div className="bg-space-850 p-3.5 rounded-lg border border-space-700">
                      <div className="text-[10px] text-slate-400 uppercase font-mono mb-1.5 flex items-center gap-1.5 font-semibold">
                        <Wrench className="w-3 h-3 text-emerald-400" />
                        Tool Result: {matchingToolResult.tool_name}
                      </div>
                      <div className="text-slate-200 text-xs mb-2">
                        {matchingToolResult.summary}
                      </div>
                      {/* Tool quantitative metrics chips */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                        {Object.entries(matchingToolResult.metrics)
                          .slice(0, 5)
                          .map(([key, val]) => (
                            <span
                              key={key}
                              className="bg-space-950 px-2 py-0.5 rounded border border-space-750 text-slate-300"
                            >
                              <span className="text-slate-500">{key}:</span> {String(val)}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
