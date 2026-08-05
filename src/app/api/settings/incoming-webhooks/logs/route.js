import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const logs = await prisma.webhookLog.findMany({
      where: { provider: "KYLAS" },
      orderBy: { createdAt: 'desc' },
      take: 50 // only fetch latest 50 for performance
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/settings/incoming-webhooks/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER" && session.user.role !== "WEB_DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.webhookLog.deleteMany({
      where: { provider: "KYLAS" }
    });
    return NextResponse.json({ message: "Logs cleared successfully" });
  } catch (error) {
    console.error("DELETE /api/settings/incoming-webhooks/logs error:", error);
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}
