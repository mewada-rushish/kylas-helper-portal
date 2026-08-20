import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { logId } = await params;
    
    const log = await prisma.workflowExecution.findUnique({
      where: { id: logId }
    });

    if (!log) {
      return NextResponse.json({ success: false, error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error fetching single workflow log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
