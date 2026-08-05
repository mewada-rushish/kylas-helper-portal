import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    // Attempt to parse the incoming JSON payload
    const body = await request.json();
    
    // 1. Fetch authentication configuration from the database
    const config = await prisma.incomingWebhookConfig.findUnique({
      where: { provider: "KYLAS" }
    });

    // 2. Enforce Authentication if configured
    if (config && config.authType === "BEARER_TOKEN" && config.authToken) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || authHeader !== `Bearer ${config.authToken}`) {
        console.error("Kylas Webhook Auth Failed: Invalid or missing Bearer token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("==========================================");
    console.log("RECEIVED KYLAS WEBHOOK PAYLOAD:");
    console.log(JSON.stringify(body, null, 2));
    console.log("==========================================");

    // 3. Log payload to DB if Test Mode is enabled
    if (config && config.isTestMode) {
      await prisma.webhookLog.create({
        data: {
          provider: "KYLAS",
          payload: JSON.stringify(body)
        }
      });
    }

    // Return a success response to acknowledge receipt
    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error processing Kylas webhook:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optionally handle GET requests if Kylas needs to verify the endpoint existence
export async function GET() {
  return NextResponse.json(
    { message: "Kylas Webhook Endpoint is active." },
    { status: 200 }
  );
}
