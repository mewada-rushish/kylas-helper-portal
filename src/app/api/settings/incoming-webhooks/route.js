import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logSystemAction } from "@/lib/logger";

// GET /api/settings/incoming-webhooks
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const configs = await prisma.incomingWebhookConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("GET /api/settings/incoming-webhooks error:", error);
    return NextResponse.json({ error: "Failed to fetch incoming webhooks" }, { status: 500 });
  }
}

// POST /api/settings/incoming-webhooks
export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER" && session.user.role !== "WEB_DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, provider, endpointPath, authType, authToken, isActive, isTestMode, selectedVariables } = body;

    const safeName = name || "Incoming Webhook";
    const safeProvider = provider || `CUSTOM_${Date.now()}`;

    let config;
    const selectedVarsStr = selectedVariables !== undefined ? (typeof selectedVariables === 'string' ? selectedVariables : JSON.stringify(selectedVariables)) : null;
    const basePath = endpointPath || `/api/webhooks/incoming/${Math.random().toString(36).substr(2, 9)}`;

    if (id) {
      config = await prisma.incomingWebhookConfig.update({
        where: { id },
        data: {
          name: safeName,
          provider: safeProvider,
          endpointPath: basePath,
          authType,
          authToken,
          isActive: isActive !== undefined ? isActive : true,
          isTestMode: isTestMode !== undefined ? isTestMode : false,
          selectedVariables: selectedVarsStr
        }
      });
      await logSystemAction(
        "Incoming Webhooks",
        "info",
        `Updated incoming webhook config: ${safeName}`
      );
    } else {
      config = await prisma.incomingWebhookConfig.create({
        data: {
          name: safeName,
          provider: safeProvider,
          endpointPath: basePath,
          authType: authType || "NO_AUTH",
          authToken,
          isActive: isActive !== undefined ? isActive : true,
          isTestMode: isTestMode !== undefined ? isTestMode : false,
          selectedVariables: selectedVarsStr
        }
      });
      await logSystemAction(
        "Incoming Webhooks",
        "info",
        `Created new incoming webhook config: ${safeName}`
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("POST /api/settings/incoming-webhooks error:", error);
    return NextResponse.json({ error: "Failed to save incoming webhook config" }, { status: 500 });
  }
}

// DELETE /api/settings/incoming-webhooks
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER" && session.user.role !== "WEB_DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.incomingWebhookConfig.delete({
      where: { id }
    });

    await logSystemAction(
      "Incoming Webhooks",
      "warning",
      `Deleted incoming webhook config with ID: ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/settings/incoming-webhooks error:", error);
    return NextResponse.json({ error: "Failed to delete incoming webhook config" }, { status: 500 });
  }
}
