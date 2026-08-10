import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedInvoice = await prisma.invoice.update({
      where: { id: id },
      data: {
        customer: body.customer,
        email: body.email,
        date: new Date(body.date),
        productId: body.productId,
        qty: body.qty,
        rate: body.rate,
        total: body.total,
        memberId: body.memberId,
        amountWords: body.amount?.words,
        paymentMethod: body.payment?.method,
        paymentReferenceNo: body.payment?.referenceNo,
        paymentBankName: body.payment?.bankName,
        paymentDate: body.payment?.date,
        periodStart: body.payment?.periodStart,
        periodEnd: body.payment?.periodEnd
      }
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.invoice.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
