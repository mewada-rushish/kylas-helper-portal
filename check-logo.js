const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.systemSetting.findUnique({where:{id:'default'}}).then(s => {
  console.log('Logo URL is:', s?.logoUrl);
  prisma.$disconnect();
});
