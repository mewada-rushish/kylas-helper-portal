import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No invoice IDs provided' }, { status: 400 });
    }

    const result = await prisma.invoice.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error bulk deleting invoices:', error);
    return NextResponse.json({ error: 'Failed to delete invoices' }, { status: 500 });
  }
}
