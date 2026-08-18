import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { logSystemAction } from "@/lib/logger";

// Helper to save base64 logo to public/uploads
function saveBase64Image(base64Data) {
  if (!base64Data || !base64Data.startsWith("data:image/")) {
    return base64Data; // Return as is if it's already a URL or empty
  }

  try {
    const matches = base64Data.match(/^data:image\/([A-Za-z0-9-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data;
    }

    let ext = matches[1];
    if (ext === "svg+xml") {
      ext = "svg";
    }
    const buffer = Buffer.from(matches[2], "base64");

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clean up old logo files if necessary, or just write with a unique timestamp
    const filename = `logo-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("Error saving logo asset:", error);
    return base64Data;
  }
}

// GET /api/settings
export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "default" }
    });

    // Auto-create with default settings if not exists
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: "default" }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    // Omit id and updatedAt during updates
    const { id, updatedAt, ...updateData } = data;

    // Convert nextSequence to Int if provided as string or invalid number
    if (updateData.nextSequence !== undefined) {
      updateData.nextSequence = parseInt(updateData.nextSequence, 10) || 1001;
    }

    // Convert base64 data to locally saved public file url
    if (updateData.logoUrl) {
      updateData.logoUrl = saveBase64Image(updateData.logoUrl);
    }

    const settings = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: updateData,
      create: { id: "default", ...updateData },
    });

    await logSystemAction(
      "General Settings",
      "success",
      `System configuration properties and runtime bounds were successfully updated by user.`
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
