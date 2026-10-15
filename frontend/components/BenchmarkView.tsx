"use client";

import React, { useState } from "react";
import { runBenchmark, BenchmarkReport } from "@/lib/api";
import {
  BarChart3,
  Play,
  Zap,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";

export default function BenchmarkView() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const data = await runBenchmark();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to run benchmark suite");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-mono text-cyan-400 font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            Standardized Empirical Evaluation Suite
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Strands Decider 2B vs LLM Baseline Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Evaluates tool selection across 8 identical labeled astronomical anomaly test cases.
            Measures round-trip decision latency, valid-choice rate, decision agreement, and empirical cost.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-space-950 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-950"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-space-950 border-t-transparent rounded-full animate-spin" />
              <span>Running Suite (8 Cases)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute Benchmark Suite</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-800/60 p-4 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Benchmark Results */}
      {report ? (
        <div className="space-y-6">
          {/* Top Level Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* 1. Mean Latency Comparison */}
            <div className="bg-space-900 border border-space-700/80 rounded-xl p-4 shadow space-y-2">
              <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                <span>Mean Decision Latency</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Decider 2B</div>
                  <div className="text-xl font-bold text-cyan-300">
                    {report.decider_mean_latency_ms.toFixed(1)}ms
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">LLM Baseline</div>
                  <div className="text-base font-semibold text-slate-400">
                    {report.llm_mean_latency_ms.toFixed(1)}ms
                  </div>
                </div>
              </div>
              {report.latency_speedup_factor && (
                <div className="text-[11px] text-emerald-400 font-semibold pt-1 border-t border-space-800">
                  {report.latency_speedup_factor.toFixed(1)}x Faster Forward Pass
                </div>
              )}
            </div>

            {/* 2. Tool Selection Accuracy */}
            <div className="bg-space-900 border border-space-700/80 rounded-xl p-4 shadow space-y-2">
              <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                <span>Ground-Truth Accuracy</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Decider 2B</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {report.decider_accuracy_pct}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">LLM Baseline</div>
                  <div className="text-base font-semibold text-slate-300">
                    {report.llm_accuracy_pct}%
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-space-800">
                Sample Size: N = {report.sample_size} cases
              </div>
            </div>

            {/* 3. Decision Agreement */}
            <div className="bg-space-900 border border-space-700/80 rounded-xl p-4 shadow space-y-2">
              <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                <span>Model Agreement</span>
                <Layers className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="text-xl font-bold text-violet-400">
                {report.decision_agreement_pct}%
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-space-800">
                Identical choices across both models
              </div>
            </div>

            {/* 4. Estimated Cost per 1K Decisions */}
            <div className="bg-space-900 border border-space-700/80 rounded-xl p-4 shadow space-y-2">
              <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                <span>Cost / 1K Decisions</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Decider 2B</div>
                  <div className="text-base font-bold text-emerald-400">
                    ${report.decider_estimated_cost_per_1k_decisions_usd.toFixed(4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">LLM Baseline</div>
                  <div className="text-base font-semibold text-slate-400">
                    ${report.llm_estimated_cost_per_1k_decisions_usd.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-space-800">
                Estimated token pricing
              </div>
            </div>
          </div>

          {/* Test Conditions Notice */}
          <div className="bg-space-950 p-4 rounded-xl border border-space-800 flex items-start gap-3 text-xs text-slate-400 font-mono">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-slate-200">
                Test Conditions & Hardware Environment:
              </div>
              <div>
                Platform: {report.test_conditions.os} | Python: {report.test_conditions.python_version} | Decider: {report.test_conditions.decider_endpoint} | Baseline: {report.llm_model_name}
              </div>
              <div className="text-[11px] text-slate-500">
                Latency values represent measured wall-clock round-trip times. Cost values are analytical estimates based on standard AWS pricing models.
              </div>
            </div>
          </div>

          {/* Detailed Test Cases Matrix */}
          <div className="bg-space-900 border border-space-700/80 rounded-xl overflow-hidden shadow">
            <div className="p-4 border-b border-space-800">
              <h3 className="text-xs uppercase font-mono font-bold text-slate-200 tracking-wider">
                Individual Evaluation Matrix (N = {report.detailed_results.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-space-950 text-slate-400 border-b border-space-800">
                  <tr>
                    <th className="py-2.5 px-4">Case ID</th>
                    <th className="py-2.5 px-4">Scenario</th>
                    <th className="py-2.5 px-4">Ground Truth</th>
                    <th className="py-2.5 px-4">Decider 2B Pick</th>
                    <th className="py-2.5 px-4">Decider Latency</th>
                    <th className="py-2.5 px-4">LLM Baseline Pick</th>
                    <th className="py-2.5 px-4">LLM Latency</th>
                    <th className="py-2.5 px-4">Agreement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-800 text-slate-300">
                  {report.detailed_results.map((row) => (
                    <tr key={row.case_id} className="hover:bg-space-850/60 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-cyan-400">{row.case_id}</td>
                      <td className="py-2.5 px-4 text-slate-200">{row.scenario_name}</td>
                      <td className="py-2.5 px-4 text-emerald-400">{row.ground_truth_tool}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            row.decider_result.is_correct
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {row.decider_result.selected_action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {row.decider_result.latency_ms.toFixed(1)}ms
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {row.llm_result.selected_action || "ERROR"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {row.llm_result.latency_ms.toFixed(1)}ms
                      </td>
                      <td className="py-2.5 px-4">
                        {row.decision_agreement ? (
                          <span className="text-emerald-400 font-bold">MATCH</span>
                        ) : (
                          <span className="text-amber-400 font-bold">DIVERGED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-space-900 border border-space-700/60 rounded-xl p-12 text-center text-slate-500">
          <BarChart3 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <div className="text-sm font-semibold text-slate-300">
            No Benchmark Results in Memory
          </div>
          <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click &apos;Execute Benchmark Suite&apos; above to run the 8 labeled evaluation scenarios across
            Strands Decider 2B and the Amazon Bedrock LLM baseline.
          </div>
        </div>
      )}
    </div>
  );
}
