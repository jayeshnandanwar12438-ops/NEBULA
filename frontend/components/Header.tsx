"use client";

import React, { useEffect, useState } from "react";
import { HealthStatus } from "@/lib/api";
import { Cpu, Cloud, ShieldCheck, Clock, Activity } from "lucide-react";

interface HeaderProps {
  health: HealthStatus | null;
  activeViewTitle: string;
}

export default function Header({ health, activeViewTitle }: HeaderProps) {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const deciderOnline = health?.strands_decider.status === "online";
  const bedrockOnline = !health?.amazon_bedrock.is_development_mode;
  const runtimeMode = health?.runtime_mode || "CONNECTING";

  return (
    <header className="h-16 bg-space-900/90 backdrop-blur border-b border-space-700/60 px-6 flex items-center justify-between shrink-0">
      {/* Title & Section */}
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          {activeViewTitle}
        </h1>
        <span className="text-xs text-slate-500 font-mono">|</span>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          MODE: {runtimeMode}
        </span>
      </div>

      {/* Telemetry Status Pills */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Strands Decider Status */}
        <div className="flex items-center space-x-2 bg-space-850 px-3 py-1.5 rounded-lg border border-space-700/70">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Decider 2B:</span>
          <span
            className={`font-mono font-medium ${
              deciderOnline ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {deciderOnline ? "ONLINE (Qwen Torso)" : "DEV FALLBACK"}
          </span>
        </div>

        {/* Amazon Bedrock Status */}
        <div className="flex items-center space-x-2 bg-space-850 px-3 py-1.5 rounded-lg border border-space-700/70">
          <Cloud className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-slate-400">Bedrock:</span>
          <span
            className={`font-mono font-medium ${
              bedrockOnline ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {bedrockOnline ? "AWS CONVERSE" : "DEV SIMULATED"}
          </span>
        </div>

        {/* UTC Observatory Clock */}
        <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 font-mono text-[11px] bg-space-950/70 px-2.5 py-1.5 rounded border border-space-800">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{utcTime || "CALIBRATING..."}</span>
        </div>
      </div>
    </header>
  );
}
