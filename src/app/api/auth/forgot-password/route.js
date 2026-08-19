import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.isDeleted) {
      // Return 200 even if not found to prevent user enumeration
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.headers.get("origin");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const origin = host ? (host.startsWith('http') ? host : `${proto}://${host}`) : (process.env.NEXTAUTH_URL || "http://localhost:3000");
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    let transporter;

    // 1. Try OAuth2 (Recommended for company emails)
    if (process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.OAUTH_REFRESH_TOKEN && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        service: 'gmail', // Defaulting to gmail, can be changed based on provider
        auth: {
          type: 'OAuth2',
          user: process.env.SMTP_USER,
          clientId: process.env.OAUTH_CLIENT_ID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        }
      });
    } 
    // 2. Try Basic SMTP (Username/Password)
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"AsmitA Admin Portal" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: "Password Reset Request",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h2>Reset your password</h2>
              <p>You recently requested to reset your password for your AsmitA Operations account.</p>
              <p>Click the button below to reset it. This link is valid for 24 hours.</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #27347B; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                Reset Password
              </a>
              <p>If you did not request a password reset, please ignore this email.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        // We still consider the request successful if the token was generated
        // but log the error for the admin
      }
    } else {
      console.log("\n=================================");
      console.log("Email not configured. Printing reset link to console:");
      console.log(`[FORGOT PASSWORD LINK FOR ${user.email}]`);
      console.log(resetLink);
      console.log("=================================\n");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
