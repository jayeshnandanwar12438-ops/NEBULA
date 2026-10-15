"use client";

import React, { useEffect, useState } from "react";
import Sidebar, { NavTab } from "@/components/Sidebar";
import Header from "@/components/Header";
import InvestigationPanel from "@/components/InvestigationPanel";
import LightCurveChart from "@/components/LightCurveChart";
import DecisionTimeline from "@/components/DecisionTimeline";
import ScientificReportCard from "@/components/ScientificReportCard";
import DecisionLabView from "@/components/DecisionLabView";
import BenchmarkView from "@/components/BenchmarkView";
import SettingsView from "@/components/SettingsView";
import CosmicNebulaCanvas from "@/components/CosmicNebulaCanvas";
import ScientificHudOverlay from "@/components/ScientificHudOverlay";
import HologramTargetViewer from "@/components/HologramTargetViewer";
import {
  AstronomicalTarget,
  HealthStatus,
  InvestigationSession,
  getHealth,
  getObservations,
  listInvestigations,
  startInvestigation,
} from "@/lib/api";
import {
  Telescope,
  Sparkles,
  History,
  AlertCircle,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  Orbit,
} from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("investigate");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [targets, setTargets] = useState<AstronomicalTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("SN-2026-X1");
  const [userQuery, setUserQuery] = useState<string>(
    "An astronomical object became significantly brighter between two observations. Determine whether the evidence suggests a transient event, a moving object, or a possible measurement artifact."
  );
  const [maxSteps, setMaxSteps] = useState<number>(4);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.40);

  const [currentSession, setCurrentSession] = useState<InvestigationSession | null>(null);
  const [historyList, setHistoryList] = useState<InvestigationSession[]>([]);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [h, t, hist] = await Promise.all([
        getHealth().catch(() => null),
        getObservations().catch(() => []),
        listInvestigations().catch(() => []),
      ]);
      if (h) setHealth(h);
      if (t && t.length > 0) {
        setTargets(t);
        setSelectedTargetId(t[0].target_id);
      }
      if (hist) setHistoryList(hist);
    } catch (err: any) {
      console.error("Initial data load error:", err);
    }
  };

  const handleLaunchInvestigation = async () => {
    setIsInvestigating(true);
    setErrorMessage(null);
    try {
      const session = await startInvestigation({
        target_id: selectedTargetId,
        user_query: userQuery,
        max_steps: maxSteps,
        confidence_threshold: confidenceThreshold,
      });
      setCurrentSession(session);
      // Refresh history
      listInvestigations().then(setHistoryList).catch(() => {});
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to execute investigation");
    } finally {
      setIsInvestigating(false);
    }
  };

  const activeTarget = targets.find((t) => t.target_id === selectedTargetId);

  const getTitle = () => {
    switch (currentTab) {
      case "overview":
        return "Mission Telemetry & Overview";
      case "investigate":
        return "Autonomous Space Anomaly Investigation";
      case "history":
        return "Investigation Archive & Audit Trail";
      case "decision-lab":
        return "Strands Decider 2B Decision Lab";
      case "benchmark":
        return "Empirical Benchmark & Evaluation";
      case "settings":
        return "Observatory Settings & Configuration";
      default:
        return "NEBULA";
    }
  };

  return (
    <div className="flex h-screen bg-space-950 text-slate-100 overflow-hidden font-sans relative">
      {/* 3D Cosmic Nebula & Starfield Interactive Background Canvas */}
      <CosmicNebulaCanvas />

      {/* Navigation Sidebar */}
      <div className="relative z-10">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          runtimeMode={health?.runtime_mode}
        />
      </div>

      {/* Main Observatory Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Header */}
        <Header health={health} activeViewTitle={getTitle()} />

        {/* Real-time Motion Graphics Scientific HUD Overlay */}
        <ScientificHudOverlay
          activeTargetName={activeTarget?.name || activeTarget?.target_id}
          isInvestigating={isInvestigating}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-grid-pattern relative">
          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-800/80 p-4 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {currentTab === "overview" && (
            <div className="space-y-6">
              {/* Mission Hero Banner */}
              <div className="bg-gradient-to-r from-space-900/90 via-space-850/80 to-space-900/90 border border-cyan-800/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-2xl space-y-3 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                    AWS Strands Decider 2B Agent Experience Hackathon 2026
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                    Autonomous Space Anomaly Investigator
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    NEBULA solves the critical agent bottleneck: routing between complex observational
                    tools in real time. Discrete tool selection is delegated to the ultra-fast, single-pass
                    <span className="text-cyan-400 font-semibold font-mono"> Strands Decider 2B </span>
                    model, while <span className="text-violet-400 font-semibold font-mono">Amazon Bedrock</span>{" "}
                    synthesizes peer-review-grade astrophysical reports with empirical evidence citations.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => setCurrentTab("investigate")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-950 font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Start New Investigation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentTab("decision-lab")}
                      className="px-4 py-2 bg-space-800/90 hover:bg-space-750 text-slate-200 border border-cyan-800/40 font-mono text-xs rounded-lg transition-all backdrop-blur-sm"
                    >
                      Open Decision Lab
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-space-900/80 backdrop-blur-md p-4 rounded-xl border border-cyan-900/40 shadow-lg space-y-1 relative overflow-hidden">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider">Decision Engine</div>
                  <div className="text-base font-bold text-cyan-400">Strands Decider 2B</div>
                  <div className="text-[11px] text-slate-400">Pointer-head classification</div>
                </div>
                <div className="bg-space-900/80 backdrop-blur-md p-4 rounded-xl border border-violet-900/40 shadow-lg space-y-1 relative overflow-hidden">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider">Reasoning Cloud</div>
                  <div className="text-base font-bold text-violet-400">Amazon Bedrock</div>
                  <div className="text-[11px] text-slate-400">Claude 3.5 Sonnet / Converse API</div>
                </div>
                <div className="bg-space-900/80 backdrop-blur-md p-4 rounded-xl border border-emerald-900/40 shadow-lg space-y-1 relative overflow-hidden">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider">Active Synthetic Targets</div>
                  <div className="text-base font-bold text-emerald-400">{targets.length} Cataloged</div>
                  <div className="text-[11px] text-slate-400">Transients, NEOs, Artifacts</div>
                </div>
                <div className="bg-space-900/80 backdrop-blur-md p-4 rounded-xl border border-amber-900/40 shadow-lg space-y-1 relative overflow-hidden">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider">Historical Investigations</div>
                  <div className="text-base font-bold text-amber-400">{historyList.length} Archived</div>
                  <div className="text-[11px] text-slate-400">Full audit trail preserved</div>
                </div>
              </div>

              {/* Quick Anomaly Catalog */}
              <div className="bg-space-900/80 backdrop-blur-md border border-space-700/80 rounded-xl p-5 shadow-lg space-y-3">
                <h3 className="text-xs uppercase font-mono font-bold text-slate-200 tracking-wider flex items-center gap-2">
                  <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                  Available Synthetic Anomaly Catalog
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {targets.map((tgt) => (
                    <div
                      key={tgt.target_id}
                      onClick={() => {
                        setSelectedTargetId(tgt.target_id);
                        setCurrentTab("investigate");
                      }}
                      className="bg-space-950/70 p-3.5 rounded-lg border border-space-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                          {tgt.target_id}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-850 text-slate-400 border border-space-750 uppercase">
                          {tgt.expected_classification.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-slate-200 text-xs font-semibold">{tgt.name}</div>
                      <div className="text-slate-400 text-[11px] line-clamp-2">{tgt.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEW INVESTIGATION */}
          {currentTab === "investigate" && (
            <div className="space-y-6">
              {/* Investigation Input Panel */}
              <InvestigationPanel
                targets={targets}
                selectedTargetId={selectedTargetId}
                onSelectTarget={setSelectedTargetId}
                userQuery={userQuery}
                onChangeQuery={setUserQuery}
                maxSteps={maxSteps}
                onChangeMaxSteps={setMaxSteps}
                confidenceThreshold={confidenceThreshold}
                onChangeThreshold={setConfidenceThreshold}
                isInvestigating={isInvestigating}
                onLaunchInvestigation={handleLaunchInvestigation}
              />

              {/* Active Target 3D Hologram Projection & Multi-Epoch Charts */}
              {activeTarget && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1">
                    <HologramTargetViewer target={activeTarget} />
                  </div>
                  <div className="xl:col-span-2">
                    <LightCurveChart epochs={activeTarget.epochs} targetName={activeTarget.name} />
                  </div>
                </div>
              )}

              {/* Real-time Decider Decision Timeline */}
              {currentSession && (
                <div className="space-y-6 pt-2">
                  <DecisionTimeline
                    decisions={currentSession.decisions}
                    toolResults={currentSession.tool_results}
                  />

                  {/* Final Scientific Report */}
                  {currentSession.final_report && (
                    <ScientificReportCard report={currentSession.final_report} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVESTIGATION HISTORY */}
          {currentTab === "history" && (
            <div className="space-y-4">
              <div className="bg-space-900/80 backdrop-blur-md border border-space-700/80 rounded-xl p-5 shadow flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    Completed Investigation Sessions
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological audit log of autonomous anomaly investigations.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-space-950 px-2.5 py-1 rounded border border-space-800">
                  {historyList.length} Sessions
                </span>
              </div>

              {historyList.length > 0 ? (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.investigation_id}
                      onClick={() => {
                        setCurrentSession(item);
                        setSelectedTargetId(item.target.target_id);
                        setCurrentTab("investigate");
                      }}
                      className="bg-space-900/80 backdrop-blur-md border border-space-700/70 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all shadow-sm space-y-2 hover:shadow-[0_0_15px_rgba(6,182,212,0.12)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-400">{item.investigation_id}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-200">{item.target.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{item.decisions.length} Decisions</span>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 font-sans line-clamp-1">
                        &quot;{item.user_query}&quot;
                      </div>

                      {item.final_report && (
                        <div className="pt-2 border-t border-space-800 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono text-[11px]">
                            Primary Outcome:{" "}
                            <span className="text-emerald-400 font-bold uppercase">
                              {item.final_report.primary_classification.replace("_", " ")}
                            </span>
                          </span>
                          <span className="text-cyan-400 font-mono text-[11px] flex items-center gap-1 hover:underline">
                            Inspect Full Session <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-space-900/80 backdrop-blur-md border border-space-700/60 rounded-xl p-12 text-center text-slate-400 text-xs">
                  No completed investigations yet. Launch one from &apos;New Investigation&apos;!
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DECISION LAB */}
          {currentTab === "decision-lab" && <DecisionLabView />}

          {/* TAB 5: BENCHMARK SUITE */}
          {currentTab === "benchmark" && <BenchmarkView />}

          {/* TAB 6: SETTINGS */}
          {currentTab === "settings" && (
            <SettingsView health={health} onRefreshHealth={fetchInitialData} />
          )}
        </main>
      </div>
    </div>
  );
}
