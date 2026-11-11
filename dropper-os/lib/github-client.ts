/**
 * Octokit-Powered GitHub Automation Bridge
 * Handles automated file commits, report publication, and GitHub Actions triggers.
 */

import { Octokit } from "@octokit/rest";

export interface PushFilePayload {
  path: string;
  content: string;
  commitMessage: string;
  branch?: string;
}

export class GitHubFleetClient {
  private octokit: Octokit | null = null;
  private owner: string;
  private repo: string;
  private token: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
    this.owner = process.env.GITHUB_REPO_OWNER || "hampusi97";
    this.repo = process.env.GITHUB_REPO_NAME || "bizi-bees";

    if (this.token) {
      this.octokit = new Octokit({ auth: this.token });
    }
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  /**
   * Push or update a file directly in the repository via GitHub Contents API
   */
  async pushFile({ path, content, commitMessage, branch = "main" }: PushFilePayload) {
    if (!this.octokit) {
      console.log(`[GitHubFleetClient:Simulated] File '${path}' staged for commit: "${commitMessage}"`);
      return { success: true, sha: "simulated_sha_" + Date.now().toString(16), simulated: true };
    }

    try {
      // Check if file already exists to get its SHA for update
      let sha: string | undefined;
      try {
        const existing = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: branch,
        });
        if (!Array.isArray(existing.data) && "sha" in existing.data) {
          sha = existing.data.sha;
        }
      } catch (err: any) {
        // File does not exist yet; will be created
        if (err.status !== 404) throw err;
      }

      const contentBase64 = Buffer.from(content).toString("base64");

      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: commitMessage,
        content: contentBase64,
        branch,
        sha,
      });

      return {
        success: true,
        sha: response.data.commit.sha,
        html_url: response.data.commit.html_url,
      };
    } catch (err: any) {
      console.error(`[GitHubFleetClient] Error pushing '${path}':`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Commits the daily intelligence report to reports/YYYY-MM-DD.md
   */
  async commitDailyIntelligenceReport(dateStr: string, markdownContent: string) {
    const reportPath = `reports/${dateStr}.md`;
    const message = `chore(report): automated 24h fleet intelligence digest for ${dateStr} [skip ci]`;

    return this.pushFile({
      path: reportPath,
      content: markdownContent,
      commitMessage: message,
    });
  }

  /**
   * Trigger a specific GitHub Actions workflow by filename
   */
  async triggerWorkflow(workflowId: string, ref = "main", inputs: Record<string, any> = {}) {
    if (!this.octokit) {
      console.log(`[GitHubFleetClient:Simulated] Triggered workflow '${workflowId}' on ref '${ref}'`);
      return { success: true, simulated: true };
    }

    try {
      await this.octokit.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowId,
        ref,
        inputs,
      });
      return { success: true };
    } catch (err: any) {
      console.error(`[GitHubFleetClient] Failed to dispatch workflow '${workflowId}':`, err.message);
      return { success: false, error: err.message };
    }
  }
}
