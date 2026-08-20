import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const logs = await prisma.workflowExecution.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workflowId: true,
        triggerWebhookId: true,
        status: true,
        currentStepIndex: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true
      },
      take: 50 // Limit to recent 50 executions
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching workflow logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
