import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logSystemAction } from "@/lib/logger";

// GET /api/workflows/[id]
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === "ACCOUNTING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const workflow = await prisma.workflowRule.findUnique({
      where: { id }
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("GET /api/workflows/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 });
  }
}

// PUT /api/workflows/[id]
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === "ACCOUNTING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.trigger !== undefined) updateData.trigger = body.trigger;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.nodesCount !== undefined) updateData.nodesCount = body.nodesCount;
    if (body.config !== undefined) updateData.config = body.config;

    const workflow = await prisma.workflowRule.upsert({
      where: { id },
      update: updateData,
      create: {
        id,
        name: body.name || "New Automation Workflow",
        trigger: body.trigger || "lead.created",
        status: body.status || "draft",
        nodesCount: body.nodesCount || 1,
        config: body.config || null
      }
    });

    await logSystemAction(
      "Automation Workflows",
      "info",
      `Updated workflow rule: ${workflow.name}`,
      JSON.stringify(workflow, null, 2)
    );

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("PUT /api/workflows/[id] error:", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

// DELETE /api/workflows/[id]
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === "ACCOUNTING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.workflowRule.delete({
      where: { id }
    });

    await logSystemAction(
      "Automation Workflows",
      "warning",
      `Deleted workflow rule with ID: ${id}`,
      JSON.stringify({ deletedWorkflowId: id }, null, 2)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workflows/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
