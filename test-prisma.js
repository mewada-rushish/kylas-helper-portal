const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.incomingWebhookConfig.findMany();
  console.log(JSON.stringify(data, null, 2));
}

main().finally(() => prisma.$disconnect());
