const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findFirst({
  where: { email: { contains: 'gonzalez' } },
  select: { id: true, email: true, name: true, userType: true }
})
.then(u => {
  console.log(JSON.stringify(u, null, 2));
  return prisma.$disconnect();
})
.catch(e => {
  console.error('Error:', e.message);
  prisma.$disconnect();
});
