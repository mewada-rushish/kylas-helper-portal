import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return Response.json(webhooks);
  } catch (error) {
    console.error("Failed to fetch outgoing webhooks:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
