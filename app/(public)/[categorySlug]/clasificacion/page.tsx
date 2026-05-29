import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function ClasificacionPage({
  params
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const p = await params;
  const category = await prisma.category.findUnique({
    where: { slug: p.categorySlug, status: 'PUBLISHED' }
  })

  if (!category) {
    notFound()
  }

  const standings = await prisma.standing.findMany({
    where: { categoryId: category.id },
    include: { team: true },
    orderBy: [
      { points: 'desc' },
      { goalsFor: 'desc' }
    ]
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Clasificación - {category.name}</h1>
          <p className="text-zinc-400">Tabla de posiciones actualizada</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider w-16">Pos</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Equipo</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider" title="Partidos Jugados">PJ</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell" title="Ganados">G</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell" title="Empatados">E</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell" title="Perdidos">P</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell" title="Goles a Favor">GF</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell" title="Goles en Contra">GC</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-blue-400 uppercase tracking-wider text-base">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900">
              {standings.map((standing, index) => (
                <tr key={standing.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                    {standing.team.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-300 font-medium">
                    {standing.played}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-400 hidden sm:table-cell">
                    {standing.won}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-400 hidden sm:table-cell">
                    {standing.drawn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-400 hidden sm:table-cell">
                    {standing.lost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-400 hidden md:table-cell">
                    {standing.goalsFor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-400 hidden md:table-cell">
                    {standing.goalsAgainst}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-center font-bold text-blue-400 bg-blue-950/10">
                    {standing.points}
                  </td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    Aún no hay clasificación disponible para esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
