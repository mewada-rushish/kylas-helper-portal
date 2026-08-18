import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { logSystemAction } from "@/lib/logger";

export async function GET(request) {
  try {
    const templates = await prisma.invoiceTemplate.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch invoice templates:", error);
    return NextResponse.json({ error: "Failed to fetch invoice templates" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, name, isDefault, attachedProductId, config, theme } = body;

    // If this template is being set as default, unset others
    if (isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const newTemplate = await prisma.invoiceTemplate.create({
      data: {
        id: id || undefined, // Allow frontend to provide ID if they want
        name: name || "New Template",
        isDefault: isDefault || false,
        attachedProductId: attachedProductId || null,
        config: config || "{}",
        theme: theme || "{}",
      },
    });

    await logSystemAction(
      "Invoice Templates",
      "success",
      `Created new invoice template: ${newTemplate.name} (${newTemplate.id})`,
      JSON.stringify(newTemplate, null, 2)
    );

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice template:", error);
    await logSystemAction(
      "Invoice Templates",
      "error",
      `Failed to create template: ${error.message}`
    );
    return NextResponse.json({ error: "Failed to create invoice template" }, { status: 500 });
  }
}
