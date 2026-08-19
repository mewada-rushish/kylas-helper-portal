import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.update({
      where: { id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In a real application, you might send an email here.
    // For now, we will return the link for the admin to copy.
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.headers.get("origin");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const origin = host ? (host.startsWith('http') ? host : `${proto}://${host}`) : (process.env.NEXTAUTH_URL || "http://localhost:3000");
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    return NextResponse.json({ resetLink });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
  }
}
