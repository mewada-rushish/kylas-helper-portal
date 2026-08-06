import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sinceStr = searchParams.get('since');
    
    if (!sinceStr) {
      return NextResponse.json({ success: false, error: "Missing 'since' parameter" }, { status: 400 });
    }

    const sinceDate = new Date(parseInt(sinceStr, 10));

    // Find the first execution for this workflow created AFTER the 'since' timestamp
    const execution = await prisma.workflowExecution.findFirst({
      where: { 
        workflowId: id,
        createdAt: {
          gt: sinceDate
        }
      },
      orderBy: { createdAt: 'desc' }
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
