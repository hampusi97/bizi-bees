/**
 * Programmatic GitHub Issue Operations Engine
 * File: dropper-os/lib/github/issue-ops.ts
 * Automatically creates and monitors restock issues for items below 7 days buffer.
 */

import { getOctokitInstance } from '../github-client';
import { InventoryForecastResult } from '../algorithms/inventory-forecaster';
import { sseEventBus } from '../telemetry/sse-event-bus';

export interface IssueOpsResult {
  productId: string;
  title: string;
  actionTaken: 'CREATED' | 'ALREADY_EXISTS' | 'SKIPPED_HEALTHY' | 'DRY_RUN';
  issueNumber?: number;
  issueUrl?: string;
}

export async function syncInventoryRestockIssues(
  forecasts: InventoryForecastResult[]
): Promise<IssueOpsResult[]> {
  const { octokit, owner, repo } = getOctokitInstance();
  const results: IssueOpsResult[] = [];

  // Filter items needing restock (< 7 days)
  const criticalItems = forecasts.filter((f) => f.daysRemaining < 7);

  if (!octokit) {
    // Dry run / unauthenticated mode
    for (const item of criticalItems) {
      console.log(`[IssueOps:DryRun] Restock ticket created for '${item.title}' (${item.daysRemaining} days left)`);
      results.push({
        productId: item.productId,
        title: item.title,
        actionTaken: 'DRY_RUN',
        issueNumber: 99,
        issueUrl: `https://github.com/${owner}/${repo}/issues/dry-run`,
      });
      sseEventBus.broadcast('issue-ops', 'issue_logged', {
        title: item.title,
        daysRemaining: item.daysRemaining,
        mode: 'DRY_RUN',
      });
    }
    return results;
  }

  try {
    // 1. Check existing open issues with 'inventory-alert'
    const openIssues = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      labels: 'inventory-alert',
    });

    const openTitles = new Set(openIssues.data.map((i) => i.title.toLowerCase()));

    for (const item of criticalItems) {
      const issueTitle = `[RESTOCK CRITICAL]: ${item.title} (< 7 Days Remaining)`;
      const titleKey = issueTitle.toLowerCase();

      // Check if duplicate already exists
      const alreadyOpen = Array.from(openTitles).some((t) => t.includes(item.title.toLowerCase()));

      if (alreadyOpen) {
        results.push({
          productId: item.productId,
          title: item.title,
          actionTaken: 'ALREADY_EXISTS',
        });
        continue;
      }

      // 2. Format Body
      const body = `## ⚠️ Autonomous Restock Alert: ${item.title}
**Dispatched by Dropper OS™ V2 Algorithmic Inventory Forecaster**

---

### Inventory Runout Summary
| Metric | Value |
| :--- | :--- |
| **Current Stock Balance** | **${item.currentStock} units** |
| **Daily Burn Velocity ($v$)** | **${item.dailyBurnVelocity} units / day** |
| **Days of Inventory Remaining (DIR)** | **${item.daysRemaining} days** |
| **Projected Stockout Date** | \`${item.projectedRunoutDate}\` |
| **Suggested Reorder Quantity ($Q$)** | **${item.suggestedReorderQty} units** |

### Automated Recommended Action
1. Issue wholesale purchase order for **${item.suggestedReorderQty} units** immediately.
2. Verify freight lead time matches estimated **7–14 business days**.
3. Once tracking number is logged, close this issue to re-arm the threshold monitor.

---
_Triggered autonomously via \`dropper-os/lib/github/issue-ops.ts\`._`;

      // 3. Create Issue
      const created = await octokit.issues.create({
        owner,
        repo,
        title: issueTitle,
        body,
        labels: ['inventory-alert', 'bizi-bees'],
      });

      results.push({
        productId: item.productId,
        title: item.title,
        actionTaken: 'CREATED',
        issueNumber: created.data.number,
        issueUrl: created.data.html_url,
      });

      // Broadcast to Desktop HUD
      sseEventBus.broadcast('issue-ops', 'issue_created', {
        title: item.title,
        issueNumber: created.data.number,
        issueUrl: created.data.html_url,
        daysRemaining: item.daysRemaining,
      });
    }
  } catch (err: any) {
    console.error('[IssueOps] Error syncing GitHub issues:', err.message);
  }

  return results;
}
