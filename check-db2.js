const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const configs = await prisma.incomingWebhookConfig.findMany();
  console.log('WEBHOOK CONFIGS:', configs);
  const recentLogs = await prisma.webhookLog.findMany({ orderBy: { id: 'desc' }, take: 5 });
  console.log('RECENT WEBHOOK LOGS:', recentLogs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
