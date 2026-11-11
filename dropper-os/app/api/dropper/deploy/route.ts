import { NextResponse } from "next/server";
import { GitHubFleetClient } from "@/lib/github-client";
import { DynamicEngine } from "@/lib/dynamic-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, componentId } = body;

    const component = DynamicEngine.getComponentById(componentId);
    if (!component) {
      return NextResponse.json(
        { success: false, error: `Component '${componentId}' not found in dynamic engine.` },
        { status: 404 }
      );
    }

    const github = new GitHubFleetClient();
    const commitMessage = `feat(storefront): inject dynamic ${component.name} into ${storeId} via Dropper OS`;

    const pushResult = await github.pushFile({
      path: component.targetPath,
      content: component.content,
      commitMessage,
      branch: "main",
    });

    // Optionally trigger Shopify theme deployment workflow
    let workflowTriggered = false;
    if (pushResult.success) {
      const triggerResult = await github.triggerWorkflow("deploy-shopify.yml");
      workflowTriggered = triggerResult.success;
    }

    return NextResponse.json({
      success: pushResult.success,
      storeId,
      componentId,
      targetPath: component.targetPath,
      commitSha: pushResult.sha,
      workflowTriggered,
      message: `Successfully injected ${component.name} into repository.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
