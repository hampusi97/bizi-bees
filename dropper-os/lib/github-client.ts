/**
 * Octokit-Powered GitHub Automation Bridge
 * File: dropper-os/lib/github-client.ts
 * Handles automated file commits, report publication, and GitHub Actions triggers.
 */

import { Octokit } from "@octokit/rest";

export interface PushFilePayload {
  path: string;
  content: string;
  commitMessage: string;
  branch?: string;
}

export function getOctokitInstance(): { octokit: Octokit | null; owner: string; repo: string } {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    "";
  const owner = process.env.GITHUB_REPO_OWNER || "hampusi97";
  const repo = process.env.GITHUB_REPO_NAME || "bizi-bees";

  return {
    octokit: token ? new Octokit({ auth: token }) : null,
    owner,
    repo,
  };
}

/**
 * Commits and pushes a file directly to the GitHub repository branch
 */
export async function commitAndPushFile(
  path: string,
  content: string,
  commitMessage: string,
  branch = "main"
): Promise<{ success: boolean; sha?: string; error?: string }> {
  // Safety Guard: Protect theme customizer settings from automated overwrites
  if (path.includes("config/settings_data.json")) {
    console.warn(`[GitHubClient] Protected file ignore rule triggered: '${path}' is locked to preserve live theme settings.`);
    return {
      success: false,
      error: "Protected file: config/settings_data.json is locked against automated overwrites to preserve live theme customizer settings.",
    };
  }

  const { octokit, owner, repo } = getOctokitInstance();

  if (!octokit) {
    console.log(`[GitHubClient:DryRun] '${path}' staged: "${commitMessage}"`);
    return { success: true, sha: "dry_run_" + Date.now().toString(16) };
  }

  try {
    let sha: string | undefined;
    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      if (!Array.isArray(existing.data) && "sha" in existing.data) {
        sha = existing.data.sha;
      }
    } catch (err: any) {
      if (err.status !== 404) throw err;
    }

    const contentBase64 = Buffer.from(content).toString("base64");

    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: contentBase64,
      branch,
      sha,
    });

    return { success: true, sha: res.data.commit.sha };
  } catch (err: any) {
    console.error(`[GitHubClient] Error pushing '${path}':`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Saves the daily generated report to reports/YYYY-MM-DD.md and reports/LATEST.md
 */
export async function commitDailyReports(
  dateStr: string,
  content: string
): Promise<{ dateReport: any; latestReport: any }> {
  const datePath = `dropper-os/reports/${dateStr}.md`;
  const latestPath = `dropper-os/reports/LATEST.md`;

  const dateRes = await commitAndPushFile(
    datePath,
    content,
    `chore(dropper): automated 24h fleet report for ${dateStr} [skip ci]`
  );

  const latestRes = await commitAndPushFile(
    latestPath,
    content,
    `chore(dropper): update LATEST fleet report digest [skip ci]`
  );

  return { dateReport: dateRes, latestReport: latestRes };
}

/**
 * Dynamically updates the root README.md with live status table and SVG badges
 */
export async function updateRootReadmeWithStatus(
  statusBadgeMarkdown: string
): Promise<{ success: boolean }> {
  const { octokit, owner, repo } = getOctokitInstance();
  if (!octokit) return { success: true };

  try {
    let existingContent = "";
    let sha: string | undefined;

    try {
      const res = await octokit.repos.getContent({
        owner,
        repo,
        path: "README.md",
        ref: "main",
      });
      if (!Array.isArray(res.data) && "content" in res.data) {
        existingContent = Buffer.from(res.data.content, "base64").toString("utf8");
        sha = res.data.sha;
      }
    } catch (e: any) {
      if (e.status !== 404) throw e;
    }

    const markerStart = "<!-- DROPPER_OS_STATUS:START -->";
    const markerEnd = "<!-- DROPPER_OS_STATUS:END -->";

    let updatedContent = "";
    if (existingContent.includes(markerStart) && existingContent.includes(markerEnd)) {
      const parts = existingContent.split(markerStart);
      const rest = parts[1].split(markerEnd);
      updatedContent = `${parts[0]}${markerStart}\n${statusBadgeMarkdown}\n${markerEnd}${rest[1]}`;
    } else {
      updatedContent = `${markerStart}\n${statusBadgeMarkdown}\n${markerEnd}\n\n${existingContent}`;
    }

    await commitAndPushFile("README.md", updatedContent, "chore(dropper): sync live fleet status badges in README [skip ci]");
    return { success: true };
  } catch (err: any) {
    console.error("[GitHubClient] Update README failed:", err.message);
    return { success: false };
  }
}

export class GitHubFleetClient {
  pushFile(payload: PushFilePayload) {
    return commitAndPushFile(payload.path, payload.content, payload.commitMessage, payload.branch);
  }

  commitDailyIntelligenceReport(dateStr: string, content: string) {
    return commitDailyReports(dateStr, content);
  }

  async triggerWorkflow(workflowId: string, ref = "main"): Promise<{ success: boolean; error?: string }> {
    const { octokit, owner, repo } = getOctokitInstance();
    if (!octokit) {
      console.log(`[GitHubClient:DryRun] Workflow '${workflowId}' triggered.`);
      return { success: true };
    }
    try {
      await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
      });
      return { success: true };
    } catch (err: any) {
      console.error(`[GitHubClient] Error triggering '${workflowId}':`, err.message);
      return { success: false, error: err.message };
    }
  }
}
