import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
       return NextResponse.json({ error: "Webhook ID is required" }, { status: 400 });
    }

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId: webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50 // only fetch latest 50 for performance
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/settings/incoming-webhooks/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
       return NextResponse.json({ error: "Webhook ID is required" }, { status: 400 });
    }

    await prisma.webhookLog.deleteMany({
      where: { webhookId: webhookId }
    });
    return NextResponse.json({ message: "Logs cleared successfully" });
  } catch (error) {
    console.error("DELETE /api/settings/incoming-webhooks/logs error:", error);
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}
