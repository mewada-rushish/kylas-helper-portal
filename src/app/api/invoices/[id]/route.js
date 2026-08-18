import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAndUploadInvoicePDF } from '@/lib/pdfGenerator';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

    const KYLAS_PRODUCTS = {
      "prod_crm_ent": "Kylas CRM Premium Enterprise License",
      "prod_iot_node": "Smart Home IoT Sensor Node (AsmitA Hub)",
      "prod_bbps_gw": "BBPS Settlement Core Gateway API",
      "prod_devops_supp": "Dedicated Cloud DevOps Maintenance Hours"
    };
    const productName = KYLAS_PRODUCTS[updatedInvoice.productId] || updatedInvoice.productId;

    const resolvedData = {
      customer: { name: updatedInvoice.customer, email: updatedInvoice.email },
      current: { date: updatedInvoice.date ? new Date(updatedInvoice.date).toISOString().split('T')[0] : "" },
      product: { name: productName, rate: `₹${updatedInvoice.rate.toLocaleString("en-IN")}`, qty: updatedInvoice.qty },
      invoice: { id: id, subtotal: `₹${updatedInvoice.rate.toLocaleString("en-IN")}`, total: `₹${updatedInvoice.total.toLocaleString("en-IN")}` },
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
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.invoice.update({
      where: { id: id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
