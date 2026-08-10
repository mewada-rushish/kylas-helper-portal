import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { logSystemAction } from "@/lib/logger";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id },
    });
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, isDefault, attachedProductId, config, theme } = body;

    if (isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updatedTemplate = await prisma.invoiceTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isDefault !== undefined && { isDefault }),
        ...(attachedProductId !== undefined && { attachedProductId }),
        ...(config && { config }),
        ...(theme && { theme }),
      },
    });

    await logSystemAction(
      "Invoice Templates",
      "success",
      `Updated template: ${updatedTemplate.name} (${id})`
    );

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Failed to update template:", error);
    await logSystemAction(
      "Invoice Templates",
      "error",
      `Failed to update template ${params.id}: ${error.message}`
    );
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const template = await prisma.invoiceTemplate.delete({
      where: { id },
    });

    await logSystemAction(
      "Invoice Templates",
      "warning",
      `Deleted template: ${template.name} (${id})`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    await logSystemAction(
      "Invoice Templates",
      "error",
      `Failed to delete template ${params.id}: ${error.message}`
    );
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
