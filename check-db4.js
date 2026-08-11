const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const executions = await prisma.workflowExecution.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('RECENT EXECUTIONS:', executions.map(e => ({id: e.id, status: e.status, createdAt: e.createdAt})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
