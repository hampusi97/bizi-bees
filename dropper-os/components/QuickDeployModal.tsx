"use client";

import React, { useState } from "react";
import { X, Zap, CheckCircle2, AlertCircle, Code, Layers, GitCommit } from "lucide-react";
import { DynamicEngine, DynamicComponentBundle } from "@/lib/dynamic-engine";

interface QuickDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStoreId?: string;
  selectedStoreName?: string;
  onDeployed?: (details: any) => void;
}

export default function QuickDeployModal({
  isOpen,
  onClose,
  selectedStoreId = "bizi-bees-boutique",
  selectedStoreName = "Bizi Bees Boutique",
  onDeployed,
}: QuickDeployModalProps) {
  const [componentId, setComponentId] = useState<string>("dynamic-free-shipping-bar");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const components = DynamicEngine.getAvailableComponents();
  const selectedComponent = components.find((c) => c.id === componentId) || components[0];

  const handleExecuteDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeployResult(null);

    try {
      const res = await fetch("/api/dropper/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStoreId,
          componentId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to deploy component.");
      }

      setDeployResult(json);
      if (onDeployed) onDeployed(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-titanium-700 bg-titanium-950 p-6 shadow-2xl relative font-sans text-titanium-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-titanium-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2.5">
          <div className="rounded-lg bg-cyber-emerald/10 p-2 border border-cyber-emerald/30">
            <Zap className="h-5 w-5 text-cyber-emerald" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">1-Click Dynamic Theme Injection</h2>
            <p className="text-xs text-titanium-400">
              Injects production-grade conversion modules into <strong className="text-white">{selectedStoreName}</strong>
            </p>
          </div>
        </div>

        {/* Component Selector */}
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-titanium-400">
            Select High-Converting Module:
          </label>

          <div className="space-y-2">
            {components.map((comp) => (
              <label
                key={comp.id}
                onClick={() => setComponentId(comp.id)}
                className={`flex items-start space-x-3 rounded-xl border p-3 cursor-pointer transition ${
                  componentId === comp.id
                    ? "border-cyber-emerald bg-cyber-emerald/10 text-white"
                    : "border-titanium-800 bg-titanium-900/60 text-titanium-300 hover:border-titanium-700"
                }`}
              >
                <input
                  type="radio"
                  name="component"
                  checked={componentId === comp.id}
                  onChange={() => setComponentId(comp.id)}
                  className="mt-1 accent-cyber-emerald"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{comp.name}</span>
                    <span className="font-mono text-[10px] text-titanium-400 bg-titanium-800 px-2 py-0.5 rounded">
                      {comp.targetPath}
                    </span>
                  </div>
                  <p className="text-xs text-titanium-400 mt-0.5">{comp.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Target Destination & Execution Flow */}
        <div className="mt-4 rounded-xl border border-titanium-800 bg-titanium-900/40 p-3 text-xs font-mono space-y-1 text-titanium-400">
          <div className="flex justify-between">
            <span>Target Repo:</span>
            <span className="text-cyber-cyan">hampusi97/bizi-bees (branch: main)</span>
          </div>
          <div className="flex justify-between">
            <span>Action Pipeline:</span>
            <span className="text-titanium-200">GitHub API Push → CI Theme Dispatch</span>
          </div>
          <div className="flex justify-between">
            <span>Target Path:</span>
            <span className="text-white">{selectedComponent.targetPath}</span>
          </div>
        </div>

        {/* Deploy Status / Error Notice */}
        {error && (
          <div className="mt-4 rounded-xl border border-cyber-rose/30 bg-cyber-rose/10 p-3 text-xs text-cyber-rose flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {deployResult && (
          <div className="mt-4 rounded-xl border border-cyber-emerald/30 bg-cyber-emerald/10 p-3 text-xs text-cyber-emerald flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{deployResult.message}</span>
            </div>
            <span className="font-mono text-[11px] underline">SHA: {deployResult.commitSha?.slice(0, 7)}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-titanium-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-titanium-700 bg-titanium-900 px-4 py-2 text-xs font-medium text-titanium-300 hover:bg-titanium-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteDeploy}
            disabled={isDeploying}
            className="flex items-center space-x-2 rounded-lg bg-cyber-emerald px-5 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50 shadow-lg shadow-cyber-emerald/20"
          >
            <Zap className={`h-4 w-4 ${isDeploying ? "animate-spin" : ""}`} />
            <span>{isDeploying ? "Pushing to GitHub..." : "Deploy to Main Branch"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
