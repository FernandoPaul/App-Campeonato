import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const cats = await p.category.findMany({
  select: { name: true, teams: { select: { name: true }, orderBy: { name: 'asc' } } }
});

for (const c of cats) {
  console.log(`\n=== ${c.name} (${c.teams.length} equipos) ===`);
  for (const t of c.teams) {
    console.log(`  - "${t.name}"`);
  }
}

await p['$disconnect']();
