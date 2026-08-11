const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const conf = await prisma.incomingWebhookConfig.findUnique({ where: { id: 'cmsfnznlk000067vcjoq8ytyw' }});
  console.log('Webhook Config:', conf);
}
main().catch(console.error).finally(() => prisma.$disconnect());
