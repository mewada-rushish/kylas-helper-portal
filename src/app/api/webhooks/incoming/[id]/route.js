import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logSystemAction } from "@/lib/logger";
import { AutomationEngine } from "@/lib/AutomationEngine";

export async function POST(request, { params }) {
  const { id } = await params; // This matches the dynamic segment [id]

  try {
    // 1. Look up the configuration by ID
    const config = await prisma.incomingWebhookConfig.findUnique({
      where: { id: id }
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
      `Received payload from ${config.provider || "External Service"} at endpoint: /api/webhooks/incoming/${id}`,
      JSON.stringify(payload, null, 2)
    );

    // 5. Trigger Automation Workflows
    const workflows = await prisma.workflowRule.findMany({
      where: {
        trigger: config.endpointPath,
        status: "active"
      }
    });

    if (workflows.length > 0) {
      for (const workflow of workflows) {
        try {
          const engine = new AutomationEngine(workflow.id);
          await engine.init(config.id);
          // Run asynchronously
          engine.run(payload).catch(err => console.error("Workflow background error:", err));
        } catch (e) {
          console.error(`Failed to start workflow ${workflow.id}:`, e);
        }
      }
    }

    return NextResponse.json({ status: "SUCCESS", message: `Webhook processed and triggered ${workflows.length} workflows` });
  } catch (error) {
    console.error(`POST /api/webhooks/incoming/${id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
