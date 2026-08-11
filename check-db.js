const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const wf = await prisma.workflowRule.findFirst({ orderBy: { updatedAt: 'desc' } });
  console.log('LATEST WORKFLOW:', wf);
  const tests = await prisma.workflowExecution.findMany({ where: { status: 'PENDING_TEST' }});
  console.log('PENDING TESTS:', tests);
}
main().catch(console.error).finally(() => prisma.$disconnect());
