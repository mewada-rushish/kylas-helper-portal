const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const configs = await prisma.incomingWebhookConfig.findMany();
  console.log('Incoming webhooks:', configs);
  const workflows = await prisma.workflowRule.findMany();
  console.log('Workflows:');
  workflows.forEach(w => console.log(w.id, w.trigger));
}
test().finally(() => prisma.$disconnect());
