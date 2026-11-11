/**
 * 07-TreasuryBot — $50K/Month Goal Engine, Net Profit P&L, Daily Report
 * Dropper OS — Phase 7 of 7
 *
 * Tracks all 15 stores against $111.11/day ($3,333/month) targets.
 * True Net Profit = Gross Sales - Discounts - Landed COGS - Shipping -
 *   (Gross x 0.029 + $0.30) - Ad Spend
 * Profit split: COGS Float 35%, Growth/Ads 25%, Tax Reserve 20%, Owner Take-Home 20%.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

interface StoreTarget {
  id: string;
  name: string;
  dailyTargetUSD: number;
  monthlyTargetUSD: number;
}

interface StoreResult {
  id: string;
  name: string;
  grossSales: number;
  discounts: number;
  landedCogs: number;
  shipping: number;
  adSpend: number;
  date: string;
}

class TreasuryBot {
  private stores: StoreTarget[] = [];
  private results: StoreResult[] = [];

  constructor() {
    this.loadStores();
    this.loadResults();
  }

  private loadStores(): void {
    const raw = readFileSync(join(ROOT, "config", "stores-15.config.json"), "utf8");
    const cfg = JSON.parse(raw);
    this.stores = cfg.stores.map((s: any) => ({
      id: s.id,
      name: s.name,
      dailyTargetUSD: s.dailyTargetUSD,
      monthlyTargetUSD: s.monthlyTargetUSD,
    }));
  }

  private loadResults(): void {
    const file = join(ROOT, "reports", "treasury-results.json");
    if (existsSync(file)) {
      this.results = JSON.parse(readFileSync(file, "utf8"));
    }
  }

  record(result: StoreResult): void {
    this.results.push(result);
    this.saveResults();
  }

  private saveResults(): void {
    mkdirSync(join(ROOT, "reports"), { recursive: true });
    writeFileSync(join(ROOT, "reports", "treasury-results.json"), JSON.stringify(this.results, null, 2));
  }

  netProfit(r: StoreResult): number {
    const processing = r.grossSales * 0.029 + 0.30;
    return r.grossSales - r.discounts - r.landedCogs - r.shipping - processing - r.adSpend;
  }

  buckets(net: number) {
    return {
      cogsFloat: Math.round((net * 0.35) * 100) / 100,
      growthAds: Math.round((net * 0.25) * 100) / 100,
      taxReserve: Math.round((net * 0.20) * 100) / 100,
      ownerTakeHome: Math.round((net * 0.20) * 100) / 100,
    };
  }

  fleetStatus(): { totalGross: number; totalNet: number; targetDaily: number; pacePercent: number; storesAtTarget: number } {
    const totalGross = this.results.reduce((s, r) => s + r.grossSales, 0);
    const totalNet = this.results.reduce((s, r) => s + this.netProfit(r), 0);
    const targetDaily = this.stores.reduce((s, r) => s + r.dailyTargetUSD, 0); // $1,667
    const pacePercent = targetDaily > 0 ? Math.round((totalNet / targetDaily) * 100) : 0;
    const storesAtTarget = this.results.filter((r) => this.netProfit(r) >= 111.11).length;
    return { totalGross, totalNet, targetDaily, pacePercent, storesAtTarget };
  }

  runDaily(): string {
    const status = this.fleetStatus();
    const b = this.buckets(status.totalNet);
    const lines: string[] = [
      "# Dropper OS — Daily Treasury Report",
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "## $50,000/Month Goal Engine",
      `- Fleet daily target: $${status.targetDaily.toFixed(2)} ($1,667/day = $111.11 x 15 stores)`,
      `- Fleet gross sales today: $${status.totalGross.toFixed(2)}`,
      `- Fleet true net profit today: $${status.totalNet.toFixed(2)}`,
      `- Goal pace: ${status.pacePercent}% of daily target`,
      `- Stores at/above target: ${status.storesAtTarget} / ${this.stores.length}`,
      "",
      `## Profit Bucket Split (on net profit $${status.totalNet.toFixed(2)})`,
      `- COGS Float (35%): $${b.cogsFloat.toFixed(2)}`,
      `- Growth/Ads (25%): $${b.growthAds.toFixed(2)}`,
      `- Tax Reserve (20%): $${b.taxReserve.toFixed(2)}`,
      `- Owner Take-Home (20%): $${b.ownerTakeHome.toFixed(2)}`,
      "",
      "## Per-Store Net Profit",
    ];
    for (const r of this.results) {
      lines.push(`- ${r.id} (${r.name}): net $${this.netProfit(r).toFixed(2)} (target $111.11/day)`);
    }
    return lines.join("\n");
  }
}

const bot = new TreasuryBot();

export { TreasuryBot, type StoreResult };

// If run directly, generate the daily report
if (process.argv[1] && process.argv[1].endsWith("07-treasury-bot.ts")) {
  const report = bot.runDaily();
  writeFileSync(join(ROOT, "reports", "TREASURY_DAILY.md"), report);
  process.stdout.write(report);
}
