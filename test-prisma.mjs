import { prisma } from '@/lib/prisma';

async function test() {
  const count = await prisma.team.count();
  console.log('Team count:', count);
}

test().catch(e => console.error('Error:', e)).finally(() => prisma.$disconnect());
