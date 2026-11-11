"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Experiment, VariantDecision } from "@/lib/algorithms/multi-armed-bandit";
import type { InventoryForecastResult } from "@/lib/algorithms/inventory-forecaster";
import type { LiveMetricsSummary, TelemetryEvent } from "@/lib/telemetry/edge-collector";
import type { IssueOpsResult } from "@/lib/github/issue-ops";

export default function DropperOsV2CommandPanel() {
  const [activeTab, setActiveTab] = useState<
    "bandit" | "inventory" | "telemetry" | "gitops"
  >("bandit");

  // 1. Multi-Armed Bandit State
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [lastDecision, setLastDecision] = useState<VariantDecision | null>(null);
  const [banditBusy, setBanditBusy] = useState<boolean>(false);

  // 2. Inventory Velocity & Issue-Ops State
  const [forecasts, setForecasts] = useState<InventoryForecastResult[]>([]);
  const [issueOpsResults, setIssueOpsResults] = useState<IssueOpsResult[]>([]);
  const [inventoryBusy, setInventoryBusy] = useState<boolean>(false);

  // 3. Edge Telemetry & Rage-Click State
  const [telemetryMetrics, setTelemetryMetrics] = useState<LiveMetricsSummary>({
    activeVisitorsLast5m: 14,
    activeCarts: 4,
    rageClicksToday: 0,
    avgScrollDepthPercent: 68,
    avgTimeToCartSeconds: 42,
    totalEventsIngested: 0,
  });
  const [recentEvents, setRecentEvents] = useState<TelemetryEvent[]>([]);
  const [telemetryBusy, setTelemetryBusy] = useState<boolean>(false);

  // 4. Daily Report & GitOps Safeguard State
  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const [gitopsFeedback, setGitopsFeedback] = useState<{
    type: "success" | "blocked";
    message: string;
  } | null>(null);
  const [gitopsBusy, setGitopsBusy] = useState<boolean>(false);

  const loadAllSubsystems = useCallback(async () => {
    try {
      const [banditRes, invRes, telRes, repRes] = await Promise.all([
        fetch("/api/bandit/decide?experiment=free-shipping-threshold"),
        fetch("/api/inventory/forecast"),
        fetch("/api/telemetry/ingest"),
        fetch("/api/dropper/report"),
      ]);

      const [banditData, invData, telData, repData] = await Promise.all([
        banditRes.json(),
        invRes.json(),
        telRes.json(),
        repRes.json(),
      ]);

      if (banditData.success) {
        setExperiments(banditData.experiments || []);
        setLastDecision(banditData.decision || null);
      }
      if (invData.success) {
        setForecasts(invData.forecasts || []);
      }
      if (telData.success) {
        setTelemetryMetrics(telData.metrics);
        setRecentEvents(telData.recentEvents || []);
      }
      if (repData.success) {
        setReportMarkdown(repData.markdown || "");
      }
    } catch {
      // Non-blocking initial load
    }
  }, []);

  useEffect(() => {
    loadAllSubsystems();
  }, [loadAllSubsystems]);

  const handleRouteShopper = async (experimentId: string) => {
    setBanditBusy(true);
    try {
      const res = await fetch(
        `/api/bandit/decide?experiment=${encodeURIComponent(experimentId)}`
      );
      const data = await res.json();
      if (data.success) {
        setLastDecision(data.decision);
        setExperiments(data.experiments || []);
      }
    } finally {
      setBanditBusy(false);
    }
  };

  const handleRecordConversion = async (
    experimentId: string,
    variantId: string
  ) => {
    setBanditBusy(true);
    try {
      const res = await fetch("/api/bandit/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experimentId, variantId }),
      });
      const data = await res.json();
      if (data.success && data.experiments) {
        setExperiments(data.experiments);
      }
    } finally {
      setBanditBusy(false);
    }
  };

  const handleDispatchRestockIssues = async () => {
    setInventoryBusy(true);
    try {
      const res = await fetch("/api/inventory/forecast", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setIssueOpsResults(data.opsResults || []);
        if (data.forecasts) setForecasts(data.forecasts);
      }
    } finally {
      setInventoryBusy(false);
    }
  };

  const handleFireTelemetryBeacon = async (
    type: "cart_add" | "scroll_depth" | "rage_click",
    extraData: Record<string, unknown>
  ) => {
    setTelemetryBusy(true);
    try {
      await fetch("/api/telemetry/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          storeId: "bizi-bees",
          path: "/stores/bizi-bees",
          device: "desktop",
          data: extraData,
        }),
      });
      const telRes = await fetch("/api/telemetry/ingest");
      const telData = await telRes.json();
      if (telData.success) {
        setTelemetryMetrics(telData.metrics);
        setRecentEvents(telData.recentEvents || []);
      }
    } finally {
      setTelemetryBusy(false);
    }
  };

  const handleTestGitOpsDeploy = async (path: string) => {
    setGitopsBusy(true);
    setGitopsFeedback(null);
    try {
      const res = await fetch("/api/dropper/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          commitMessage: `feat(dropper-os): sync ${path}`,
        }),
      });
      const data = await res.json();
      if (res.status === 403 || !data.success) {
        setGitopsFeedback({
          type: "blocked",
          message:
            data.error ||
            "Protected file safeguard blocked automated overwrite of config/settings_data.json.",
        });
      } else {
        setGitopsFeedback({
          type: "success",
          message: `${data.message} (Commit SHA: ${data.sha})`,
        });
      }
    } finally {
      setGitopsBusy(false);
    }
  };

  const handleCommitDailyReport = async () => {
    setGitopsBusy(true);
    try {
      const res = await fetch("/api/dropper/report", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReportMarkdown(data.markdown);
        setGitopsFeedback({
          type: "success",
          message: `Committed ${data.reportPath} and ${data.latestPath} with SVG status badges.`,
        });
      }
    } finally {
      setGitopsBusy(false);
    }
  };

  return (
    <section
      id="dropper-os-v2-blueprint-engine"
      className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-mono text-emerald-400">
            DROPPER OS V2.0.0 MASTER ARCHITECTURAL BLUEPRINT · SOVEREIGN GITOPS ENGINE
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Autonomous CRO Bandit, Inventory Burn Forecaster &amp; Edge Telemetry
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Replaces paid third-party Shopify apps with native Epsilon-Greedy Multi-Armed Bandit routing (ε = 0.10), linear burn-rate stockout forecasting (DIR &lt; 7 days → Octokit Issue-Ops), sub-5ms navigator.sendBeacon rage-click detection, and automated 00:00 UTC GitHub reporting.
          </p>
        </div>

        {/* Subsystem Tabs */}
        <div
          role="tablist"
          aria-label="Dropper OS V2 Subsystems"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-[#090D16] border border-slate-800 rounded-xl"
        >
          {(
            [
              { id: "bandit", label: "1. Multi-Armed Bandit (ε=0.10)" },
              { id: "inventory", label: "2. Inventory DIR & Issue-Ops" },
              { id: "telemetry", label: "3. Edge Beacon & Rage-Clicks" },
              { id: "gitops", label: "4. Daily Report & Git Safeguards" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EPSILON-GREEDY MULTI-ARMED BANDIT */}
      {activeTab === "bandit" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090D16] border border-slate-800 rounded-xl p-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-emerald-400">
                ALGORITHM: selectWinningVariant(experiment) · 90% Exploit Winner / 10% Explore
              </p>
              {lastDecision ? (
                <p className="text-sm text-white font-medium">
                  Active Routed Variant:{" "}
                  <strong className="text-emerald-300 font-mono">
                    {lastDecision.name}
                  </strong>{" "}
                  · Mode:{" "}
                  <span className="font-mono text-amber-300">
                    {lastDecision.isExploration
                      ? "10% Exploration"
                      : "90% Exploitation (Winner)"}
                  </span>{" "}
                  · CR:{" "}
                  <span className="font-mono">
                    {(lastDecision.conversionRate * 100).toFixed(2)}%
                  </span>
                </p>
              ) : (
                <p className="text-sm text-slate-300">
                  Select an experiment below to route an incoming shopper.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={banditBusy}
                onClick={() => handleRouteShopper("free-shipping-threshold")}
                className="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-colors"
              >
                Route Shipping Threshold (ε=0.10)
              </button>
              <button
                type="button"
                disabled={banditBusy}
                onClick={() => handleRouteShopper("hero-headline")}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Route Hero Headline (ε=0.10)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {experiments.map((exp) => {
              const bestVariant = [...exp.variants].sort((a, b) => {
                const crA = a.impressions > 0 ? a.conversions / a.impressions : 0;
                const crB = b.impressions > 0 ? b.conversions / b.impressions : 0;
                return crB - crA;
              })[0];

              return (
                <div
                  key={exp.id}
                  className="rounded-xl bg-[#090D16] border border-slate-800 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {exp.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        ID: {exp.id} · ε = {exp.epsilon.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">
                      Winner: {bestVariant?.id}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {exp.variants.map((v) => {
                      const cr =
                        v.impressions > 0
                          ? ((v.conversions / v.impressions) * 100).toFixed(2)
                          : "0.00";
                      const isWinner = bestVariant?.id === v.id;

                      return (
                        <div
                          key={v.id}
                          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isWinner
                              ? "bg-emerald-950/20 border-emerald-500/40"
                              : "bg-[#0F172A] border-slate-800"
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white truncate">
                                {v.name}
                              </span>
                              {isWinner && (
                                <span className="text-[11px] font-mono font-bold text-emerald-400">
                                  · 90% EXPLOIT WINNER
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono tabular-nums">
                              {v.impressions} impressions · {v.conversions} conversions ·{" "}
                              <strong className="text-white">{cr}% CR</strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={banditBusy}
                            onClick={() => handleRecordConversion(exp.id, v.id)}
                            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 shrink-0 transition-colors"
                          >
                            +1 Conversion
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PREDICTIVE INVENTORY VELOCITY & GITHUB ISSUE-OPS */}
      {activeTab === "inventory" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090D16] border border-slate-800 rounded-xl p-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-amber-300">
                FORMULA: Daily Velocity (v) = Sold_14d / 14 · DIR = CurrentStock / v
              </p>
              <p className="text-xs text-slate-300">
                When any SKU drops below{" "}
                <strong className="text-white">DIR &lt; 7 days</strong>, Dropper OS opens a GitHub Issue:{" "}
                <code className="text-emerald-300 font-mono">
                  [RESTOCK ALERT]: &#123;Product Name&#125; (&lt; 7 Days Remaining)
                </code>{" "}
                with labels <code className="text-sky-300 font-mono">inventory-alert, bizi-bees</code>.
              </p>
            </div>

            <button
              type="button"
              disabled={inventoryBusy}
              onClick={handleDispatchRestockIssues}
              className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors shrink-0"
            >
              {inventoryBusy
                ? "Syncing GitHub Issues..."
                : "Dispatch GitHub Restock Issues (DIR < 7d)"}
            </button>
          </div>

          {issueOpsResults.length > 0 && (
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-300">
                Octokit Issue-Ops Dispatch Log ({issueOpsResults.length} Critical SKUs Processed):
              </p>
              <ul className="space-y-1 text-xs font-mono text-slate-200">
                {issueOpsResults.map((res) => (
                  <li key={res.productId}>
                    ✓ {res.issueTitle} · Labels: [{res.labels.join(", ")}] · Reorder:{" "}
                    {res.suggestedReorderQty} units ({res.actionTaken})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#090D16] border-b border-slate-800 text-slate-400 font-mono">
                  <th className="p-3.5">Store &amp; SKU</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Burn Velocity (v)</th>
                  <th className="p-3.5">Days Remaining (DIR)</th>
                  <th className="p-3.5">Runout Date</th>
                  <th className="p-3.5">Suggested Reorder (Q)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
                {forecasts.map((item) => (
                  <tr key={item.productId} className="bg-[#090D16]/60 hover:bg-[#090D16]">
                    <td className="p-3.5 font-sans">
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {item.storeName} · {item.sku}
                      </div>
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      {item.currentStock} units
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {item.dailyBurnVelocity} / day
                    </td>
                    <td
                      className={`p-3.5 font-bold ${
                        item.daysRemaining < 7
                          ? "text-rose-400"
                          : item.daysRemaining <= 14
                          ? "text-amber-300"
                          : "text-emerald-400"
                      }`}
                    >
                      {item.daysRemaining} days
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {item.projectedRunoutDate}
                    </td>
                    <td className="p-3.5 text-emerald-300 font-bold">
                      {item.suggestedReorderQty} units
                    </td>
                    <td className="p-3.5">
                      <span
                        className={
                          item.status === "CRITICAL"
                            ? "text-rose-400 font-bold"
                            : item.status === "WARNING"
                            ? "text-amber-300 font-semibold"
                            : "text-emerald-400"
                        }
                      >
                        {item.status === "CRITICAL"
                          ? "CRITICAL (<7d)"
                          : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SELF-HOSTED EDGE TELEMETRY & RAGE-CLICK DETECTOR */}
      {activeTab === "telemetry" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800">
              <p className="text-xs text-slate-400">Active Visitors (5m)</p>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                {telemetryMetrics.activeVisitorsLast5m}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800">
              <p className="text-xs text-slate-400">Active Live Carts</p>
              <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                {telemetryMetrics.activeCarts}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800">
              <p className="text-xs text-slate-400">Avg Scroll Depth</p>
              <p className="text-xl font-bold text-sky-400 font-mono tabular-nums mt-1">
                {telemetryMetrics.avgScrollDepthPercent}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800">
              <p className="text-xs text-slate-400">Avg Time-to-Cart</p>
              <p className="text-xl font-bold text-amber-300 font-mono tabular-nums mt-1">
                {telemetryMetrics.avgTimeToCartSeconds}s
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800">
              <p className="text-xs text-slate-400">Rage-Clicks (≥3/800ms)</p>
              <p className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-1">
                {telemetryMetrics.rageClicksToday}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#090D16] border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-300">
              1.2KB Storefront Beacon (<code className="text-emerald-300 font-mono">/api/telemetry/ingest</code>) + SSE Stream (<code className="text-sky-300 font-mono">/api/telemetry/stream</code>)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={telemetryBusy}
                onClick={() =>
                  handleFireTelemetryBeacon("cart_add", {
                    sku: "BIZI-BOX-VINTAGE",
                    value: 44.0,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold"
              >
                + Simulate Cart Beacon
              </button>
              <button
                type="button"
                disabled={telemetryBusy}
                onClick={() =>
                  handleFireTelemetryBeacon("scroll_depth", { depth: 75 })
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                + Simulate 75% Scroll Milestone
              </button>
              <button
                type="button"
                disabled={telemetryBusy}
                onClick={() =>
                  handleFireTelemetryBeacon("rage_click", {
                    selector: "button.quick-add-btn",
                    clicksIn800ms: 4,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold"
              >
                Trigger Rage-Click Alert (≥3 clicks / 800ms)
              </button>
            </div>
          </div>

          {recentEvents.length > 0 && (
            <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-300">
                Recent Edge Beacon Events ({recentEvents.length}):
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs font-mono">
                {recentEvents.slice(0, 8).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between text-slate-300 border-b border-slate-800/60 pb-1"
                  >
                    <span>
                      [{ev.type.toUpperCase()}] {ev.storeId} · {ev.path}
                    </span>
                    <span className="text-slate-500">
                      {ev.geo?.city}, {ev.geo?.region} ·{" "}
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DAILY EXECUTIVE REPORT & GITOPS SAFEGUARDS */}
      {activeTab === "gitops" && (
        <div className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#090D16] border border-slate-800 rounded-xl p-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-emerald-400">
                SAFEGUARD 6.1: Protect config/settings_data.json · Daily Cron: .github/workflows/dropper-autoloop.yml
              </p>
              <p className="text-xs text-slate-300">
                Test the Octokit deployment bridge and verify that{" "}
                <code className="text-amber-300 font-mono">
                  config/settings_data.json
                </code>{" "}
                is locked against automated overwrites.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={gitopsBusy}
                onClick={handleCommitDailyReport}
                className="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold"
              >
                Commit Daily Report (YYYY-MM-DD.md)
              </button>
              <button
                type="button"
                disabled={gitopsBusy}
                onClick={() =>
                  handleTestGitOpsDeploy("snippets/cart-drawer.liquid")
                }
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Deploy snippets/cart-drawer.liquid
              </button>
              <button
                type="button"
                disabled={gitopsBusy}
                onClick={() =>
                  handleTestGitOpsDeploy("config/settings_data.json")
                }
                className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold"
              >
                Test config/settings_data.json Lock
              </button>
            </div>
          </div>

          {gitopsFeedback && (
            <div
              role="status"
              className={`rounded-xl p-4 text-xs font-mono border ${
                gitopsFeedback.type === "blocked"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                  : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
              }`}
            >
              {gitopsFeedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-2">
              <p className="text-xs font-bold text-white">
                Generated Daily Briefing (`reports/LATEST.md`)
              </p>
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto bg-[#0F172A] p-3 rounded-lg border border-slate-800">
                {reportMarkdown}
              </pre>
            </div>

            <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-2">
              <p className="text-xs font-bold text-white">
                Git-First Deployment Commands (`DROPPER_OS_MASTER_BLUEPRINT.md`)
              </p>
              <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap bg-[#0F172A] p-3 rounded-lg border border-slate-800">
{`# Stage Dropper OS v2.0.0 Master Blueprint, Algorithms, Storefront Modules & Order Vault
git add DROPPER_OS_MASTER_BLUEPRINT.md \\
        lib/algorithms/multi-armed-bandit.ts \\
        lib/algorithms/inventory-forecaster.ts \\
        lib/telemetry/edge-collector.ts \\
        lib/github-client.ts \\
        lib/github/issue-ops.ts \\
        app/api/telemetry/ \\
        app/api/bandit/decide/route.ts \\
        app/api/inventory/forecast/route.ts \\
        app/api/dropper/ \\
        app/account/orders/page.tsx \\
        app/stores/[storeId]/page.tsx

# Commit without touching config/settings_data.json
git commit -m "feat(dropper-os-v2): implement master blueprint, editorial Bizi Bees UX, MAB & Firestore order vault"

# Push to trigger .github/workflows/dropper-autoloop.yml
git push origin main`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
