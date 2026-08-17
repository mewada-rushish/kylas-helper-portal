import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AutomationEngine } from '@/lib/AutomationEngine';

export async function POST(request, { params }) {
  let routeId = null;
  let execId = null;
  try {
    const { id, executionId } = await params;
    routeId = id;
    execId = executionId;

    // Fetch the original execution
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId }
    });

    if (!execution) {
      return NextResponse.json({ success: false, error: "Execution not found" }, { status: 404 });
    }

    // Extract the original trigger payload from context
    let context;
    try {
      context = JSON.parse(execution.context);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to parse execution context" }, { status: 500 });
    }

    const triggerPayload = context?.trigger?.payload;
    if (!triggerPayload) {
      return NextResponse.json({ success: false, error: "No trigger payload found in execution context" }, { status: 400 });
    }

    // Initialize and run the workflow again
    const engine = new AutomationEngine(id);
    await engine.init(execution.triggerWebhookId || "legacy_kylas");
    
    // Run asynchronously so we don't block the API response
    engine.run(triggerPayload).catch(err => console.error("Workflow background error on rerun:", err));

    return NextResponse.json({ success: true, message: "Workflow rerun initiated", newExecutionId: engine.executionLog.id });
  } catch (error) {
    console.error('Error rerunning workflow:', error);
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;
    return NextResponse.json({ 
      success: false, 
      error: msg,
      stack: stack,
      debug: { routeId, execId }
    }, { status: 500 });
  }
}
