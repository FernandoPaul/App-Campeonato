import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Datos exactos de la imagen del Excel
const rows = [
  { cat: 'Absoluta', home: 'F. D. F. Guate',         away: 'N. T. N.',               jornada: 'Jornada 1' },
  { cat: 'Absoluta', home: 'C. D. Napoli',            away: 'Sport Paraguay',          jornada: 'Jornada 1' },
  { cat: 'Absoluta', home: 'Chapines',                away: 'F. C. Honduras',          jornada: 'Jornada 1' },
  { cat: 'Absoluta', home: 'Deportivo Unión',         away: 'Unión Familiar',          jornada: 'Jornada 1' },
  { cat: 'Absoluta', home: 'Inter Navalcarnero',      away: 'Sport Guarani Brunete',   jornada: 'Jornada 1' },
  { cat: 'Master',   home: 'River Plate',             away: 'Nueva América',           jornada: 'Jornada 1' },
  { cat: 'Master',   home: 'Centro América',          away: 'Amistad Latina',          jornada: 'Jornada 1' },
  { cat: 'Master',   home: 'La Vieja Escuela',        away: 'Liverpool F.C.',          jornada: 'Jornada 1' },
];

console.log('=== DIAGNÓSTICO DE IMPORTACIÓN EXCEL ===\n');
let allOk = true;

for (let i = 0; i < rows.length; i++) {
  const { cat, home, away, jornada } = rows[i];
  const fila = i + 2;
  process.stdout.write(`Fila ${fila}: [${cat}] ${home} vs ${away} ... `);

  const category = await p.category.findFirst({
    where: { name: { equals: cat, mode: 'insensitive' } }
  });

  if (!category) {
    console.log(`❌ CATEGORÍA "${cat}" NO ENCONTRADA`);
    allOk = false;
    continue;
  }

  const homeTeam = await p.team.findFirst({
    where: { categoryId: category.id, name: { equals: home, mode: 'insensitive' } }
  });

  if (!homeTeam) {
    console.log(`❌ EQUIPO LOCAL "${home}" NO ENCONTRADO en ${cat}`);
    allOk = false;
    continue;
  }

  const awayTeam = await p.team.findFirst({
    where: { categoryId: category.id, name: { equals: away, mode: 'insensitive' } }
  });

  if (!awayTeam) {
    console.log(`❌ EQUIPO VISITANTE "${away}" NO ENCONTRADO en ${cat}`);
    allOk = false;
    continue;
  }

  console.log(`✅ OK`);
}

if (allOk) {
  console.log('\n✅ TODOS LOS EQUIPOS ENCONTRADOS - El error es otro (posiblemente en el parseo del archivo Excel)');
} else {
  console.log('\n❌ Hay equipos/categorías que no coinciden con la base de datos.');
}

await p['$disconnect']();
