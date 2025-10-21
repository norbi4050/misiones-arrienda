const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Intentar con tabla Conversation
    let conv = await prisma.conversation.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Sample conversation ID:', conv?.id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conv?.id || '');
    console.log('ID format:', isUUID ? 'UUID' : 'CUID/Other');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
