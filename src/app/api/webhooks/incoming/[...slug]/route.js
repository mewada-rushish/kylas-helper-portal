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
      if (!authHeader || (authHeader !== `Bearer ${config.authToken}` && authHeader !== config.authToken)) {
        console.error(`Webhook auth failed for ${pathname}. Expected: Bearer ${config.authToken}, Got: ${authHeader}`);
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
      `Received payload from ${config.provider || "External Service"} at endpoint: ${pathname}`,
      JSON.stringify(payload, null, 2)
    );

    // 5. Trigger Automation Workflows
    // Find all active workflows for this trigger OR workflows that are currently in test mode
    const activeWorkflows = await prisma.workflowRule.findMany({
      where: {
        trigger: pathname,
        status: 'active'
      }
    });

    const pendingTests = await prisma.workflowExecution.findMany({
      where: {
        status: 'PENDING_TEST',
        workflow: {
          trigger: pathname
        }
      },
      include: { workflow: true }
    });

    // Execute active workflows normally (we would normally do this async, but doing await here for simplicity)
    const { AutomationEngine } = await import('@/lib/AutomationEngine');
    
    for (const rule of activeWorkflows) {
      try {
        const engine = new AutomationEngine(rule.id);
        await engine.init(config.id);
        await engine.run(payload);
      } catch (err) {
        console.error(`Workflow ${rule.id} failed:`, err);
      }
    }

    // Execute pending tests
    for (const testExecution of pendingTests) {
      try {
        const engine = new AutomationEngine(testExecution.workflowId);
        await engine.init(config.id, testExecution.id); // pass the existing executionId
        await engine.run(payload);
      } catch (err) {
        console.error(`Test execution ${testExecution.id} failed:`, err);
      }
    }

    return NextResponse.json({ status: "SUCCESS", message: "Webhook processed and workflows triggered" });
  } catch (error) {
    console.error(`POST ${pathname} error:`, error);
    return NextResponse.json({ error: "Internal server error", message: error.message, stack: error.stack }, { status: 500 });
  }
}
