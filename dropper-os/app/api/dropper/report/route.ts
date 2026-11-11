import { NextResponse } from "next/server";
import { DropperKernel } from "@/lib/dropper-core";
import { GitHubFleetClient } from "@/lib/github-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kernel = new DropperKernel();
    const summary = await kernel.getFleetTelemetry();
    const dateStr = new Date().toISOString().split("T")[0];
    const reportMarkdown = kernel.generateDailyReportMarkdown(summary, dateStr);

    return NextResponse.json({
      success: true,
      date: dateStr,
      report: reportMarkdown,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const kernel = new DropperKernel();
    const github = new GitHubFleetClient();
    const summary = await kernel.getFleetTelemetry();
    const dateStr = new Date().toISOString().split("T")[0];
    const reportMarkdown = kernel.generateDailyReportMarkdown(summary, dateStr);

    const result = await github.commitDailyIntelligenceReport(dateStr, reportMarkdown);

    return NextResponse.json({
      success: result.dateReport?.success ?? true,
      date: dateStr,
      commitSha: result.dateReport?.sha,
      message: `Daily report for ${dateStr} committed to /reports/${dateStr}.md`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
