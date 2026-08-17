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

    let newInvoice = await prisma.invoice.create({
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

    const KYLAS_PRODUCTS = {
      "prod_crm_ent": "Kylas CRM Premium Enterprise License",
      "prod_iot_node": "Smart Home IoT Sensor Node (AsmitA Hub)",
      "prod_bbps_gw": "BBPS Settlement Core Gateway API",
      "prod_devops_supp": "Dedicated Cloud DevOps Maintenance Hours"
    };
    const productName = KYLAS_PRODUCTS[newInvoice.productId] || newInvoice.productId;

    const formatDDMMYYYY = (isoStr) => {
      if (!isoStr) return "";
      let dStr = isoStr;
      if (dStr.includes('T')) dStr = dStr.split('T')[0];
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
      }
      return isoStr;
    };

    const resolvedData = {
      customer: { name: newInvoice.customer, email: newInvoice.email },
      current: { date: newInvoice.date ? formatDDMMYYYY(new Date(newInvoice.date).toISOString().split('T')[0]) : "" },
      product: { name: productName, rate: `₹${newInvoice.rate.toLocaleString("en-IN")}`, qty: newInvoice.qty },
      invoice: { id: id, subtotal: `₹${newInvoice.rate.toLocaleString("en-IN")}`, total: `₹${newInvoice.total.toLocaleString("en-IN")}` },
      memberId: newInvoice.memberId,
      amount: { words: newInvoice.amountWords },
      payment: {
        method: newInvoice.paymentMethod,
        referenceNo: newInvoice.paymentReferenceNo,
        bankName: newInvoice.paymentBankName,
        date: formatDDMMYYYY(newInvoice.paymentDate),
        periodStart: formatDDMMYYYY(newInvoice.periodStart),
        periodEnd: formatDDMMYYYY(newInvoice.periodEnd)
      }
    };

    try {
      const { generateAndUploadInvoicePDF } = require('@/lib/pdfGenerator');
      const { publicUrl } = await generateAndUploadInvoicePDF(id, resolvedData);
      newInvoice = await prisma.invoice.update({ where: { id: id }, data: { pdfUrl: publicUrl } });
    } catch (pdfErr) {
      console.error("Failed to generate PDF on create:", pdfErr);
    }

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
