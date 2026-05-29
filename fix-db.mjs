import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// 1. Eliminar Champions League y Primera División con todos sus datos
const catsToDelete = ['champions-league', 'primera-division'];

for (const slug of catsToDelete) {
  const cat = await p.category.findUnique({ where: { slug } });
  if (!cat) { console.log(`Categoría ${slug} no encontrada, saltando...`); continue; }
  
  // Borrar standings
  const delStandings = await p.standing.deleteMany({ where: { categoryId: cat.id } });
  console.log(`  Standings eliminados: ${delStandings.count}`);
  
  // Borrar partidos
  const delMatches = await p.match.deleteMany({ where: { categoryId: cat.id } });
  console.log(`  Partidos eliminados: ${delMatches.count}`);
  
  // Borrar equipos
  const delTeams = await p.team.deleteMany({ where: { categoryId: cat.id } });
  console.log(`  Equipos eliminados: ${delTeams.count}`);
  
  // Borrar categoría
  await p.category.delete({ where: { id: cat.id } });
  console.log(`✅ Categoría "${cat.name}" eliminada completamente.`);
}

// 2. Mover "Amistad Latina" de Master a Absoluta
const absoluta = await p.category.findUnique({ where: { slug: 'absoluta-vdp' } });
if (absoluta) {
  const amistad = await p.team.findFirst({ where: { name: 'Amistad Latina' } });
  if (amistad) {
    await p.team.update({ where: { id: amistad.id }, data: { categoryId: absoluta.id } });
    console.log('✅ "Amistad Latina" movida a Absoluta.');
  }
}

// 3. Corregir "Centro America" -> "Centro América" (añadir tilde)
const centro = await p.team.findFirst({ where: { name: 'Centro America' } });
if (centro) {
  await p.team.update({ where: { id: centro.id }, data: { name: 'Centro América' } });
  console.log('✅ "Centro America" renombrado a "Centro América".');
}

// 4. Corregir "Nueva América " (quitar espacio final)
const nueva = await p.team.findFirst({ where: { name: { startsWith: 'Nueva América' } } });
if (nueva) {
  await p.team.update({ where: { id: nueva.id }, data: { name: 'Nueva América' } });
  console.log('✅ "Nueva América " corregido (espacio eliminado).');
}

// Verificación final
console.log('\n=== ESTADO FINAL ===');
const cats = await p.category.findMany({ select: { name: true, _count: { select: { teams: true } } } });
for (const c of cats) {
  console.log(`  ${c.name}: ${c._count.teams} equipos`);
}

await p['$disconnect']();
