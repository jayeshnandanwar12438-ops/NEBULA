"use client";

import React from "react";
import {
  Telescope,
  Compass,
  FileSearch,
  History,
  FlaskConical,
  BarChart3,
  Settings,
  Radio,
  Sparkles,
} from "lucide-react";

export type NavTab = "overview" | "investigate" | "history" | "decision-lab" | "benchmark" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  runtimeMode?: string;
}

export default function Sidebar({ currentTab, onSelectTab, runtimeMode }: SidebarProps) {
  const navItems = [
    { id: "overview" as NavTab, label: "Galactic Overview", icon: Compass },
    { id: "investigate" as NavTab, label: "New Investigation", icon: FileSearch },
    { id: "history" as NavTab, label: "Investigation History", icon: History },
    { id: "decision-lab" as NavTab, label: "Decision Lab", icon: FlaskConical },
    { id: "benchmark" as NavTab, label: "Benchmark Suite", icon: BarChart3 },
    { id: "settings" as NavTab, label: "Settings & Config", icon: Settings },
  ];

  const isLive = runtimeMode && runtimeMode.includes("LIVE_DECIDER");

  return (
    <aside className="w-64 glass-panel m-3 mr-0 h-[calc(100vh-1.5rem)] flex flex-col justify-between shrink-0 select-none border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
      <div>
        {/* Brand Header */}
        <div className="p-4 pb-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-violet-600/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Telescope className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5 font-mono">
                NEBULA
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  2B
                </span>
              </div>
              <div className="text-[11px] text-slate-400 tracking-tight font-sans">
                Anomaly Investigator
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Telemetry Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] rounded-b-2xl">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Decider 2B Status</span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              isLive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
            }`}
          >
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            {isLive ? "ONLINE (2B)" : "DEV FALLBACK"}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 leading-relaxed font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>AWS Strands Hackathon &apos;26</span>
        </div>
      </div>
    </aside>
  );
}
