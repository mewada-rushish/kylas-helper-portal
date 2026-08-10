import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Map db data to match frontend structure
    const mapped = invoices.map(inv => ({
      ...inv,
      date: inv.date.toISOString().split("T")[0],
      amount: { words: inv.amountWords || "" },
      payment: {
        method: inv.paymentMethod || "Cash",
        referenceNo: inv.paymentReferenceNo || "",
        bankName: inv.paymentBankName || "",
        date: inv.paymentDate || "",
        periodStart: inv.periodStart || "",
        periodEnd: inv.periodEnd || ""
      }
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // generate ID if not provided, just in case
    const id = body.id || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        id: id,
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

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
