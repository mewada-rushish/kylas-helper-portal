import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logSystemAction } from "@/lib/logger";

export async function POST(request, { params }) {
  // We can construct the path from the slug, or just use request.nextUrl.pathname
  const { pathname } = request.nextUrl;

  try {
    // 1. Look up the configuration by unique endpointPath
    const config = await prisma.incomingWebhookConfig.findUnique({
      where: { endpointPath: pathname }
    });

    if (!config) {
      return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
    }

    if (!config.isActive) {
      return NextResponse.json({ error: "Webhook endpoint is currently disabled" }, { status: 403 });
    }

    // 2. Authenticate the request based on config
    if (config.authType === "BEARER_TOKEN" && config.authToken) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || authHeader !== `Bearer ${config.authToken}`) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
    }

    // 3. Parse the incoming payload
    const payload = await request.json();

    // 4. If Test Mode is ON, log the payload
    if (config.isTestMode) {
      await prisma.webhookLog.create({
        data: {
          webhookId: config.id,
          payload: JSON.stringify(payload)
        }
      });
    }

    // Always log to System Logs so it shows up in the UI
    await logSystemAction(
      "Incoming Webhooks",
      "success",
      `Received payload from ${config.provider || "External Service"} at endpoint: ${pathname}`
    );

    // (Future Step 5: Trigger Automation Workflows)

    return NextResponse.json({ status: "SUCCESS", message: "Webhook processed" });
  } catch (error) {
    console.error(`POST ${pathname} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
