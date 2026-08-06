import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const versions = await prisma.workflowVersion.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 versions
    });

    return NextResponse.json({ success: true, versions });
  } catch (error) {
    console.error('Error fetching workflow versions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { config, description, author } = body;

    // Check how many versions exist to determine the next version number
    const versionCount = await prisma.workflowVersion.count({
      where: { workflowId: id }
    });
    
    const versionName = `v${versionCount + 1}`;

    const newVersion = await prisma.workflowVersion.create({
      data: {
        workflowId: id,
        versionName,
        config: JSON.stringify(config),
        description: description || `Auto-saved version ${versionName}`,
        author: author || "Admin"
      }
    });

    return NextResponse.json({ success: true, version: newVersion });
  } catch (error) {
    console.error('Error creating workflow version:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
