import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AutomationEngine } from '@/lib/AutomationEngine';

export async function POST(request, { params }) {
  try {
    const { id, executionId } = await params;

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
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      debug: { id, executionId }
    }, { status: 500 });
  }
}
