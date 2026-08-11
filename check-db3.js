const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pathname = '/api/webhooks/incoming/kylas/deals/create';
  
  const pendingTests = await prisma.workflowExecution.findMany({
    where: {
      status: 'PENDING_TEST',
      workflow: {
        trigger: pathname
      }
    },
    include: { workflow: true }
  });
  console.log('PENDING TESTS FOUND BY PATHNAME:', pendingTests);
}
main().catch(console.error).finally(() => prisma.$disconnect());
