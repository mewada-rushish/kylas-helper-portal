import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAndUploadInvoicePDF } from '@/lib/pdfGenerator';


const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    let updatedInvoice = await prisma.invoice.update({
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
        amountWords: body.amount?.words || body.amountWords,
        paymentMethod: body.payment?.method || body.paymentMethod,
        paymentReferenceNo: body.payment?.referenceNo || body.paymentReferenceNo,
        paymentBankName: body.payment?.bankName || body.paymentBankName,
        paymentDate: body.payment?.date || body.paymentDate,
        periodStart: body.payment?.periodStart || body.periodStart,
        periodEnd: body.payment?.periodEnd || body.periodEnd
      }
    });

    const resolvedData = {
      customer: { name: updatedInvoice.customer, email: updatedInvoice.email },
      current: { date: updatedInvoice.date },
      product: { name: updatedInvoice.productId },
      invoice: { subtotal: updatedInvoice.rate, total: updatedInvoice.total },
      memberId: updatedInvoice.memberId,
      amount: { words: updatedInvoice.amountWords },
      payment: {
        method: updatedInvoice.paymentMethod,
        referenceNo: updatedInvoice.paymentReferenceNo,
        bankName: updatedInvoice.paymentBankName,
        date: updatedInvoice.paymentDate,
        periodStart: updatedInvoice.periodStart,
        periodEnd: updatedInvoice.periodEnd
      }
    };

    try {


      const { publicUrl } = await generateAndUploadInvoicePDF(id, resolvedData);
      updatedInvoice = await prisma.invoice.update({ where: { id: id }, data: { pdfUrl: publicUrl } });
    } catch (pdfErr) {
      console.error("Failed to regenerate PDF on edit:", pdfErr);
    }

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
