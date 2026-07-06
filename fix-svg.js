const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  const files = fs.readdirSync(uploadDir);
  
  for (const file of files) {
    if (file.endsWith('.svg+xml')) {
      const oldPath = path.join(uploadDir, file);
      const newPath = path.join(uploadDir, file.replace('.svg+xml', '.svg'));
      fs.renameSync(oldPath, newPath);
    }
  }

  const s = await prisma.systemSetting.findUnique({where:{id:'default'}});
  if (s && s.logoUrl && s.logoUrl.endsWith('.svg+xml')) {
    await prisma.systemSetting.update({
      where: { id: 'default' },
      data: { logoUrl: s.logoUrl.replace('.svg+xml', '.svg') }
    });
    console.log('Fixed DB logoUrl');
  }
  
  await prisma.$disconnect();
}
fix();
