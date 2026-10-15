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
} from "lucide-react";

export type NavTab = "overview" | "investigate" | "history" | "decision-lab" | "benchmark" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  runtimeMode?: string;
}

export default function Sidebar({ currentTab, onSelectTab, runtimeMode }: SidebarProps) {
  const navItems = [
    { id: "overview" as NavTab, label: "Overview", icon: Compass },
    { id: "investigate" as NavTab, label: "New Investigation", icon: FileSearch },
    { id: "history" as NavTab, label: "Investigation History", icon: History },
    { id: "decision-lab" as NavTab, label: "Decision Lab", icon: FlaskConical },
    { id: "benchmark" as NavTab, label: "Benchmark Suite", icon: BarChart3 },
    { id: "settings" as NavTab, label: "Settings & Config", icon: Settings },
  ];

  const isLive = runtimeMode && runtimeMode.includes("LIVE_DECIDER");

  return (
    <aside className="w-64 bg-space-900 border-r border-space-700/60 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-space-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-violet-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Telescope className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5">
                NEBULA
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
                  2B
                </span>
              </div>
              <div className="text-[11px] text-slate-400 tracking-tight">
                Anomaly Investigator
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-space-800/60 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Telemetry Footer */}
      <div className="p-4 border-t border-space-700/60 bg-space-950/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Decider 2B Status</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              isLive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
            }`}
          >
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            {isLive ? "ONLINE (2B)" : "DEV FALLBACK"}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 leading-relaxed font-mono">
          AWS Strands Hackathon &apos;26
        </div>
      </div>
    </aside>
  );
}
