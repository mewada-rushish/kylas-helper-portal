const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.incomingWebhookConfig.update({
    where: { endpointPath: '/api/webhooks/incoming/kylas/deals/create' },
    data: { authType: 'NONE' }
  });
  console.log('Auth disabled');
}
main().catch(console.error).finally(() => prisma.$disconnect());
