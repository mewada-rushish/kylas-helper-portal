import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logSystemAction } from "@/lib/logger";

// PUT /api/settings/webhooks/[id]
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    
    // Extrapolate and stringify JSON structures
    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.triggerType !== undefined) updateData.triggerType = body.triggerType;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.method !== undefined) updateData.method = body.method;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.bodyPayload !== undefined) updateData.bodyPayload = body.bodyPayload;
    
    if (body.headers !== undefined) {
      updateData.headers = body.headers ? JSON.stringify(body.headers) : null;
    }
    if (body.queryParams !== undefined) {
      updateData.queryParams = body.queryParams ? JSON.stringify(body.queryParams) : null;
    }
    if (body.selectedVariables !== undefined) {
      updateData.selectedVariables = body.selectedVariables ? JSON.stringify(body.selectedVariables) : null;
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData
    });

    const logPayload = { ...webhook };
    if (logPayload.headers) {
      try {
        const parsed = JSON.parse(logPayload.headers);
        logPayload.headers = JSON.stringify(parsed.map(h => ({ ...h, value: h.isSecret ? "********" : h.value })));
      } catch(e) {}
    }

    await logSystemAction(
      "Outgoing Webhooks",
      "info",
      `Updated outgoing webhook: ${webhook.name || id}`,
      JSON.stringify(logPayload, null, 2)
    );

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("PUT /api/settings/webhooks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }
}

// DELETE /api/settings/webhooks/[id]
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.webhook.delete({
      where: { id }
    });

    await logSystemAction(
      "Outgoing Webhooks",
      "warning",
      `Deleted outgoing webhook with ID: ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/settings/webhooks/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}
