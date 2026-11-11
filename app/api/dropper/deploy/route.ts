import { NextRequest, NextResponse } from "next/server";
import { commitAndPushFile } from "@/lib/github-client";
import { checkBearerSecret } from "@/lib/server/api-auth";

export async function POST(req: NextRequest) {
  // This route commits to the repository with a GitHub token, so it must be
  // authenticated. It was previously reachable by anyone who could load the site.
  const authFailure = checkBearerSecret(
    req.headers.get("authorization"),
    "DROPPER_DEPLOY_SECRET"
  );
  if (authFailure) {
    console.warn(`Dropper deploy rejected: ${authFailure}`);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const targetPath = String(
      body.path || "snippets/cart-drawer.liquid"
    ).trim();
    const commitMessage = String(
      body.commitMessage || `feat(dropper-os): deploy ${targetPath}`
    );
    const content = String(
      body.content || `<!-- Synchronized by Dropper OS v2.0.0: ${targetPath} -->`
    );

    const result = await commitAndPushFile(targetPath, content, commitMessage);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          protectedGuardTriggered: targetPath.includes(
            "config/settings_data.json"
          ),
          error: result.error,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      path: targetPath,
      sha: result.sha,
      message: `Synchronized ${targetPath} via Dropper OS GitOps pipeline (config/settings_data.json safeguard active).`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deploy error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
