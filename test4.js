const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const hooks = await prisma.webhookLog.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
  console.log('Recent incoming webhook logs:', hooks);
  
  const execs = await prisma.workflowExecution.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
  console.log('Recent executions:', execs);
  
  const sysLogs = await prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
  console.log('Recent system logs:', sysLogs);
}
run().finally(() => prisma.$disconnect());
