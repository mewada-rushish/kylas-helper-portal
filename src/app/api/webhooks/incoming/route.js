import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const incomingWebhooks = await prisma.incomingWebhookConfig.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(incomingWebhooks);
  } catch (error) {
    console.error("GET /api/webhooks/incoming error:", error);
    return NextResponse.json({ error: "Failed to fetch incoming webhooks" }, { status: 500 });
  }
}
