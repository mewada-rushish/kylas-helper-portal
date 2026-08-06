const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const workflows = await prisma.workflowRule.findMany({ 
    where: { trigger: { not: 'lead.created' } },
    take: 1 
  });
  if (workflows.length === 0) { console.log('No workflows found'); return; }
  const wf = workflows[0];
  console.log('Testing workflow:', wf.id, 'with trigger:', wf.trigger);

  // create pending test
  const exec = await prisma.workflowExecution.create({
    data: {
      workflowId: wf.id,
      status: 'PENDING_TEST',
      context: '{}',
      logs: '[]'
    }
  });
  console.log('Created pending test:', exec.id);

  console.log('Triggering webhook on path:', wf.trigger);
  const res = await fetch('http://localhost:3000' + wf.trigger, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 62wTyENtCd8ub3lfSfZY4ALid1vvEa'
    },
    body: JSON.stringify({ entity: { id: 1 }, event: 'DEAL_CREATED' })
  });
  console.log('Webhook response status:', res.status);
  console.log('Webhook response body:', await res.text());

  // check if execution updated
  const updatedExec = await prisma.workflowExecution.findUnique({ where: { id: exec.id } });
  console.log('Execution status after webhook:', updatedExec.status);
}
test().catch(console.error).finally(() => prisma.$disconnect());
