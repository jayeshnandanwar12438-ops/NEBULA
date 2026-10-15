"use client";

import React from "react";
import { ScientificReport } from "@/lib/api";
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface ScientificReportCardProps {
  report: ScientificReport | null | undefined;
}

export default function ScientificReportCard({ report }: ScientificReportCardProps) {
  if (!report) {
    return null;
  }

  const isDev = report.is_development_mode;
  const confidencePct = (report.classification_confidence * 100).toFixed(0);

  const getBadgeColor = (classification: string) => {
    switch (classification) {
      case "transient_event":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "moving_object":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "measurement_artifact":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "variable_source":
        return "bg-violet-500/10 text-violet-400 border-violet-500/30";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <div className="bg-space-900 border border-space-700/80 rounded-xl p-6 shadow-xl shadow-black/50 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-space-800">
        <div>
          <div className="text-xs uppercase tracking-wider font-mono text-violet-400 font-semibold flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Synthesized Scientific Investigation Report
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Target: {report.target_name} ({report.target_id})
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Classification Pill */}
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-mono">
              Primary Classification
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold uppercase border mt-0.5 ${getBadgeColor(
                report.primary_classification
              )}`}
            >
              {report.primary_classification.replace("_", " ")} ({confidencePct}%)
            </span>
          </div>

          {/* Model Provenance */}
          <div
            className={`px-3 py-1 rounded border text-xs font-mono ${
              isDev
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {isDev ? "DEV REPORT" : "LIVE BEDROCK"}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-space-850 p-4 rounded-lg border border-space-750">
        <div className="text-xs font-mono uppercase text-slate-400 font-semibold mb-1">
          Executive Summary
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {report.executive_summary}
        </p>
      </div>

      {/* Three Pillars: Observed Facts vs Interpretations vs Unknowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Observed Facts */}
        <div className="bg-space-950 p-4 rounded-lg border border-space-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-cyan-400 uppercase mb-2.5 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Observed Facts (Empirical)
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.observed_facts.map((fact, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-cyan-500 font-mono mt-0.5">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Physical Interpretations */}
        <div className="bg-space-950 p-4 rounded-lg border border-space-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-violet-400 uppercase mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Physical Interpretations
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.interpretations.map((interp, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-violet-500 font-mono mt-0.5">•</span>
                  <span>{interp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Unknowns & Uncertainties */}
        <div className="bg-space-950 p-4 rounded-lg border border-space-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-amber-400 uppercase mb-2.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Unknowns & Uncertainties
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.unknowns_and_uncertainties.map((unk, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-amber-500 font-mono mt-0.5">•</span>
                  <span>{unk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tool Evidence References */}
      <div className="bg-space-950/60 p-4 rounded-lg border border-space-800">
        <div className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2">
          Empirical Tool Evidence Citations
        </div>
        <div className="space-y-1.5 text-xs text-slate-400 font-mono">
          {report.evidence_references.map((ref, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-600">[{i + 1}]</span>
              <span className="text-slate-300">{ref}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Follow-up */}
      {report.recommended_follow_up && report.recommended_follow_up.length > 0 && (
        <div className="pt-2 border-t border-space-800">
          <div className="text-xs font-mono uppercase text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Recommended Telescope Follow-Up Actions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {report.recommended_follow_up.map((act, i) => (
              <div
                key={i}
                className="bg-space-950 p-2.5 rounded border border-space-800 text-slate-300 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px] font-mono shrink-0">
                  {i + 1}
                </span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer telemetry */}
      <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-space-800 flex justify-between">
        <span>Reasoning Engine: {report.model_id}</span>
        <span>Generated: {new Date(report.generated_at).toUTCString()}</span>
      </div>
    </div>
  );
}
