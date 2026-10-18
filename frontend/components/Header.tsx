"use client";

import React, { useEffect, useState } from "react";
import { HealthStatus } from "@/lib/api";
import { Cpu, Cloud, Clock, Sparkles } from "lucide-react";

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
    <header className="h-16 mx-6 mt-3 glass-panel px-6 flex items-center justify-between shrink-0 border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.5)] z-20">
      {/* Title & Section */}
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2 tracking-tight">
          {activeViewTitle}
        </h1>
        <span className="text-xs text-slate-600 font-mono">/</span>
        <span className="text-[11px] font-mono text-cyan-300 glass-pill px-2.5 py-0.5 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
          {runtimeMode}
        </span>
      </div>

      {/* Telemetry Status Pills */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Strands Decider Status */}
        <div className="flex items-center space-x-2 glass-pill px-3 py-1.5 border border-white/[0.08]">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Decider 2B:</span>
          <span
            className={`font-mono font-medium ${
              deciderOnline ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {deciderOnline ? "ONLINE (Qwen Torso)" : "DEV FALLBACK"}
          </span>
        </div>

        {/* Amazon Bedrock Status */}
        <div className="flex items-center space-x-2 glass-pill px-3 py-1.5 border border-white/[0.08]">
          <Cloud className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-slate-400">Bedrock:</span>
          <span
            className={`font-mono font-medium ${
              bedrockOnline ? "text-emerald-300" : "text-slate-300"
            }`}
          >
            {bedrockOnline ? "AWS CONVERSE" : "DEV SIMULATED"}
          </span>
        </div>

        {/* UTC Observatory Clock */}
        <div className="hidden lg:flex items-center space-x-1.5 text-slate-300 font-mono text-[11px] glass-pill px-3 py-1.5 border border-white/[0.08]">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{utcTime || "CALIBRATING..."}</span>
        </div>
      </div>
    </header>
  );
}
