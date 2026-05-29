import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function HomePage() {
  const recentMatches = await prisma.match.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      homeTeam: true,
      awayTeam: true,
      category: true,
    },
    orderBy: { matchDate: 'desc' },
    take: 6,
  })

  return (
    <div className="space-y-12">
      <section className="text-center py-16 px-4 rounded-3xl bg-gradient-to-b from-blue-900/20 to-zinc-950 border border-blue-900/30">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white">
          Toda la pasión del deporte
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          Sigue los resultados en vivo, clasificaciones y estadísticas de tus campeonatos favoritos en tiempo real.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Partidos Recientes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentMatches.map((match) => (
            <Link key={match.id} href={`/${match.category.slug}`} className="group block">
              <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-900/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                    {match.category.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {format(match.matchDate, "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{match.homeTeam.name}</span>
                    <span className="font-bold text-lg text-white">{match.homeScore ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{match.awayTeam.name}</span>
                    <span className="font-bold text-lg text-white">{match.awayScore ?? '-'}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/50">
                  {match.matchStatus === 'LIVE' ? (
                    <div className="flex items-center text-red-500 text-xs font-bold uppercase tracking-wider">
                      <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      En Vivo
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                      {match.matchStatus === 'FINISHED' ? 'Finalizado' : 'Programado'}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
