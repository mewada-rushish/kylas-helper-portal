import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logSystemAction } from "@/lib/logger";

// GET /api/settings/webhooks
export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER" && session.user.role !== "WEB_DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("GET /api/settings/webhooks error:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

// POST /api/settings/webhooks
export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER" && session.user.role !== "WEB_DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, triggerType, category, method, url, headers, queryParams, bodyPayload, selectedVariables } = body;

    const webhook = await prisma.webhook.create({
      data: {
        name: name || "New Webhook Hook",
        triggerType: triggerType || "LEAD_CREATED",
        category: category || "Custom",
        method: method || "POST",
        url: url || "https://api.domain.com/endpoint",
        headers: headers ? JSON.stringify(headers) : null,
        queryParams: queryParams ? JSON.stringify(queryParams) : null,
        bodyPayload: bodyPayload || "",
        selectedVariables: selectedVariables ? JSON.stringify(selectedVariables) : null,
      }
    });

    await logSystemAction(
      "Automation Workflows",
      "info",
      `Created new automation workflow: ${webhook.name}`
    );

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("POST /api/settings/webhooks error:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
