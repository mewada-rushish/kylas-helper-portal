import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/settings/logs
export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER" && session.user.role !== "WEB_DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit") || "100";
    const limit = parseInt(limitParam, 10);

    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/settings/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
