import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    
    if (!executionId) {
      return NextResponse.json({ success: false, error: "Missing 'executionId' parameter" }, { status: 400 });
    }

    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId }
    });

    if (execution) {
      return NextResponse.json({ success: true, hasResult: true, execution });
    } else {
      return NextResponse.json({ success: true, hasResult: false });
    }
  } catch (error) {
    console.error('Error checking test status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
