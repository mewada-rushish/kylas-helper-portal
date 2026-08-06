const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const w = await prisma.workflowRule.findUnique({where: {id: 'cmsh40huh0012lthsa9x6yfds'}});
  const nodes = JSON.parse(w.config).nodes;
  const triggerNode = nodes.find(n => n.type === 'trigger');
  console.log('trigger node event:', triggerNode.event);
  
  // Actually, I'll just manually fix it in the DB to test!
  await prisma.workflowRule.update({
    where: { id: 'cmsh40huh0012lthsa9x6yfds' },
    data: { trigger: triggerNode.event }
  });
  console.log('Updated trigger to', triggerNode.event);
}
test().finally(() => prisma.$disconnect());
