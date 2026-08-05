import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const { provider, endpointPath, authType, authToken, isActive, isTestMode, selectedVariables } = body;

    if (!provider || !endpointPath) {
      return NextResponse.json({ error: "Provider and endpoint path are required" }, { status: 400 });
    }

    const config = await prisma.incomingWebhookConfig.upsert({
      where: { provider: provider },
      update: {
        endpointPath,
        authType,
        authToken,
        isActive: isActive !== undefined ? isActive : true,
        isTestMode: isTestMode !== undefined ? isTestMode : false,
        selectedVariables: selectedVariables !== undefined ? (typeof selectedVariables === 'string' ? selectedVariables : JSON.stringify(selectedVariables)) : null
      },
      create: {
        provider,
        endpointPath,
        authType: authType || "NO_AUTH",
        authToken,
        isActive: isActive !== undefined ? isActive : true,
        isTestMode: isTestMode !== undefined ? isTestMode : false,
        selectedVariables: selectedVariables !== undefined ? (typeof selectedVariables === 'string' ? selectedVariables : JSON.stringify(selectedVariables)) : null
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("POST /api/settings/incoming-webhooks error:", error);
    return NextResponse.json({ error: "Failed to save incoming webhook config" }, { status: 500 });
  }
}
