const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ex = await prisma.workflowExecution.findUnique({
    where: { id: 'cmsogm1nh000967skecam934h' }
  });
  console.log('LOGS:', ex.logs);
  console.log('ERROR:', ex.errorMessage);
}
main().catch(console.error).finally(() => prisma.$disconnect());
