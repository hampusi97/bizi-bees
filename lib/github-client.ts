/**
 * GitHub REST v3 / Octokit-Compatible Automation Bridge
 * File: lib/github-client.ts
 * Handles automated file commits, report publication, issue creation, and GitHub Actions triggers
 * while enforcing the config/settings_data.json protection safeguard.
 */

export interface PushFilePayload {
  path: string;
  content: string;
  commitMessage: string;
  branch?: string;
}

export interface GitHubIssueItem {
  number: number;
  title: string;
  html_url: string;
}

export interface OctokitCompatibleClient {
  repos: {
    getContent(params: {
      owner: string;
      repo: string;
      path: string;
      ref?: string;
    }): Promise<{ data: { sha?: string; content?: string } }>;
    createOrUpdateFileContents(params: {
      owner: string;
      repo: string;
      path: string;
      message: string;
      content: string;
      branch?: string;
      sha?: string;
    }): Promise<{ data: { commit: { sha: string } } }>;
  };
  issues: {
    listForRepo(params: {
      owner: string;
      repo: string;
      state?: string;
      labels?: string;
    }): Promise<{ data: GitHubIssueItem[] }>;
    create(params: {
      owner: string;
      repo: string;
      title: string;
      body: string;
      labels?: string[];
    }): Promise<{ data: GitHubIssueItem }>;
  };
}

function createGitHubRestClient(token: string): OctokitCompatibleClient {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  return {
    repos: {
      async getContent({ owner, repo, path, ref = "main" }) {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(
            ref
          )}`,
          { headers }
        );
        if (!res.ok) {
          const err = new Error(`GitHub API ${res.status}`) as Error & {
            status?: number;
          };
          err.status = res.status;
          throw err;
        }
        const data = await res.json();
        return { data };
      },
      async createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content,
        branch = "main",
        sha,
      }) {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
          }
        );
        if (!res.ok) {
          throw new Error(`GitHub PUT ${res.status}`);
        }
        const data = await res.json();
        return { data };
      },
    },
    issues: {
      async listForRepo({ owner, repo, state = "open", labels = "" }) {
        const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${encodeURIComponent(
          state
        )}${labels ? `&labels=${encodeURIComponent(labels)}` : ""}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`GitHub Issues GET ${res.status}`);
        }
        const data = await res.json();
        return { data: Array.isArray(data) ? data : [] };
      },
      async create({ owner, repo, title, body, labels = [] }) {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ title, body, labels }),
          }
        );
        if (!res.ok) {
          throw new Error(`GitHub Issues POST ${res.status}`);
        }
        const data = await res.json();
        return { data };
      },
    },
  };
}

export function getOctokitInstance(): {
  octokit: OctokitCompatibleClient | null;
  owner: string;
  repo: string;
} {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    "";
  const owner = process.env.GITHUB_REPO_OWNER || "hampusi97";
  const repo = process.env.GITHUB_REPO_NAME || "bizi-bees";

  return {
    octokit: token ? createGitHubRestClient(token) : null,
    owner,
    repo,
  };
}

export async function commitAndPushFile(
  path: string,
  content: string,
  commitMessage: string,
  branch = "main"
): Promise<{ success: boolean; sha?: string; error?: string }> {
  // Production Safeguard 6.1: Never blindly overwrite config/settings_data.json
  if (path.includes("config/settings_data.json")) {
    return {
      success: false,
      error:
        "Protected file: config/settings_data.json is locked against automated overwrites to preserve live Shopify Theme Customizer settings.",
    };
  }

  const { octokit, owner, repo } = getOctokitInstance();

  if (!octokit) {
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
      if (existing.data && existing.data.sha) {
        sha = existing.data.sha;
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status !== 404) throw err;
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown GitHub error";
    return { success: false, error: message };
  }
}

export async function commitDailyReports(
  dateStr: string,
  content: string
): Promise<{
  dateReport: { success: boolean; sha?: string; error?: string };
  latestReport: { success: boolean; sha?: string; error?: string };
}> {
  const datePath = `reports/${dateStr}.md`;
  const latestPath = `reports/LATEST.md`;

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
