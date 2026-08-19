import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logSystemAction } from "@/lib/logger";

// GET /api/workflows
export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === "ACCOUNTING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const workflows = await prisma.workflowRule.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

// POST /api/workflows
export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === "ACCOUNTING" || session.user.role === "MARKETING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, trigger, status, nodesCount, config } = body;

    const workflow = await prisma.workflowRule.create({
      data: {
        id: id || undefined, // Allow passing custom ID (like draft ID) if needed
        name: name || "New Automation Workflow",
        trigger: trigger || "lead.created",
        status: status || "draft",
        nodesCount: nodesCount || 1,
        config: config || null
      }
    });

    await logSystemAction(
      "Automation Workflows",
      "info",
      `Created new workflow rule: ${workflow.name}`,
      JSON.stringify(workflow, null, 2)
    );

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
