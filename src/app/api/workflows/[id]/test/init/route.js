import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    // Create a new PENDING_TEST execution
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: "PENDING_TEST",
        context: "{}",
        logs: "[]"
      }
    });

    return NextResponse.json({ success: true, execution });
  } catch (error) {
    console.error('Error init test workflow:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
