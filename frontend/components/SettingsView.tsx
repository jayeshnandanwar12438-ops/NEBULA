"use client";

import React, { useState } from "react";
import { HealthStatus } from "@/lib/api";
import { Settings, Shield, Server, Cloud, Cpu, CheckCircle2, RefreshCw } from "lucide-react";

interface SettingsViewProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
}

export default function SettingsView({ health, onRefreshHealth }: SettingsViewProps) {
  const [deciderUrl, setDeciderUrl] = useState(
    health?.strands_decider.endpoint || "http://localhost:8000"
  );
  const [bedrockModel, setBedrockModel] = useState(
    health?.amazon_bedrock.model_id || "anthropic.claude-3-5-sonnet-20241022-v2:0"
  );
  const [awsRegion, setAwsRegion] = useState(health?.amazon_bedrock.region || "us-east-1");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs uppercase font-mono text-cyan-400 font-semibold mb-1">
            <Settings className="w-4 h-4" />
            Runtime Configuration & Environment
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            System & Inference Provider Settings
          </h2>
        </div>
        <button
          onClick={onRefreshHealth}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 text-slate-300 border border-space-700 text-xs font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* Model Providers Card */}
      <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Strands Decider 2B Endpoint Configuration
        </h3>

        <div className="grid grid-cols-1 gap-4 text-xs">
          <div>
            <label className="text-slate-400 font-mono block mb-1">
              Strands Decider Server Endpoint URL
            </label>
            <input
              type="text"
              value={deciderUrl}
              onChange={(e) => setDeciderUrl(e.target.value)}
              className="w-full bg-space-950 border border-space-800 rounded-lg p-2.5 font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Start local model:{" "}
              <code className="text-cyan-400">
                strands-decider serve StrandsAgents/strands-decider-2B-hobson-v19 --port 8000
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Amazon Bedrock Card */}
      <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-violet-400" />
          Amazon Bedrock Generative Reasoning
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">AWS Region</label>
            <input
              type="text"
              value={awsRegion}
              onChange={(e) => setAwsRegion(e.target.value)}
              className="w-full bg-space-950 border border-space-800 rounded-lg p-2.5 text-slate-200 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Bedrock Foundation Model ID</label>
            <input
              type="text"
              value={bedrockModel}
              onChange={(e) => setBedrockModel(e.target.value)}
              className="w-full bg-space-950 border border-space-800 rounded-lg p-2.5 text-slate-200 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-space-950 p-3.5 rounded-lg border border-space-800 text-xs text-slate-400">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            IAM Role & Credential Chain Security:
          </div>
          <div>
            NEBULA utilizes the standard AWS credential chain (IAM Task Roles on ECS/App Runner or
            AWS CLI profiles). Access keys are never embedded into source code or Docker layers.
          </div>
        </div>
      </div>

      {/* Hackathon Deliverables & Metadata */}
      <div className="bg-space-900 border border-space-700/80 rounded-xl p-5 space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-slate-200">
          Hackathon Metadata &amp; Compliance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="bg-space-950 p-2.5 rounded border border-space-800">
            <span className="text-slate-500 block">Agent Framework</span>
            <span className="text-cyan-400 font-bold">Strands Agents SDK</span>
          </div>
          <div className="bg-space-950 p-2.5 rounded border border-space-800">
            <span className="text-slate-500 block">Decision Model</span>
            <span className="text-cyan-400 font-bold">Strands Decider 2B</span>
          </div>
          <div className="bg-space-950 p-2.5 rounded border border-space-800">
            <span className="text-slate-500 block">Reasoning Cloud</span>
            <span className="text-violet-400 font-bold">Amazon Bedrock</span>
          </div>
          <div className="bg-space-950 p-2.5 rounded border border-space-800">
            <span className="text-slate-500 block">Official Tags</span>
            <span className="text-emerald-400 font-bold">#strands-decider-2b</span>
          </div>
        </div>
      </div>
    </div>
  );
}
