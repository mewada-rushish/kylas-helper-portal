import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { versionId } = await params;
    
    const version = await prisma.workflowVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error('Error fetching single workflow version:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
