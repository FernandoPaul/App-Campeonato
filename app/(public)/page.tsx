import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Trophy, Users, Calendar, ChevronRight, Zap } from "lucide-react"

export const metadata = {
  title: "Campeonato - Inicio",
  description: "Portal oficial del campeonato. Consulta competiciones, partidos, clasificaciones y resultados.",
}

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    where: { status: "PUBLISHED" },
    include: {
      _count: {
        select: {
          teams: true,
          matches: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  // Obtener próximos partidos (los más cercanos al presente)
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { matchStatus: "LIVE" },
        { matchStatus: { in: ["SCHEDULED", "POSTPONED"] }, matchDate: { gte: new Date() } }
      ]
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      category: true,
    },
    orderBy: { matchDate: "asc" },
    take: 4,
  })

  // Últimos resultados
  const recentResults = await prisma.match.findMany({
    where: {
      status: "PUBLISHED",
      matchStatus: "FINISHED",
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      category: true,
    },
    orderBy: { matchDate: "desc" },
    take: 4,
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ═══════════════ HERO ═══════════════ */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Temporada 2025-2026</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight">
            Portal del <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Campeonato</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Consulta competiciones, partidos programados, resultados y clasificaciones en tiempo real.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20 space-y-16">
        {/* ═══════════════ COMPETICIONES ═══════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
            <h2 className="text-2xl font-bold text-white">Competiciones</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="group relative bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-zinc-900 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-blue-400" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-zinc-500 mb-5 capitalize">{cat.sport}</p>

                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">{cat._count.teams} equipos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">{cat._count.matches} partidos</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No hay competiciones publicadas</h3>
              <p className="text-zinc-500 text-sm">Las competiciones aparecerán aquí cuando se publiquen desde el panel de administración.</p>
            </div>
          )}
        </section>

        {/* ═══════════════ PRÓXIMOS PARTIDOS ═══════════════ */}
        {upcomingMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
              <h2 className="text-2xl font-bold text-white">Próximos Partidos</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/${match.category.slug}`}
                  className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {match.category.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {match.round || ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                        {match.homeTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-zinc-200">{match.homeTeam.name}</span>
                    </div>
                    {match.matchStatus === 'LIVE' || match.matchStatus === 'FINISHED' ? (
                      <div className="flex items-center gap-2 px-4">
                        <span className={`text-2xl font-black ${(match.homeScore ?? 0) > (match.awayScore ?? 0) ? 'text-white' : 'text-zinc-500'}`}>
                          {match.homeScore ?? 0}
                        </span>
                        <span className="text-zinc-600 text-sm">-</span>
                        <span className={`text-2xl font-black ${(match.awayScore ?? 0) > (match.homeScore ?? 0) ? 'text-white' : 'text-zinc-500'}`}>
                          {match.awayScore ?? 0}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-sm font-medium">vs</span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-200">{match.awayTeam.name}</span>
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                        {match.awayTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500">
                      {match.matchDate
                        ? new Intl.DateTimeFormat("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(match.matchDate))
                        : "Fecha por definir"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════ ÚLTIMOS RESULTADOS ═══════════════ */}
        {recentResults.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
              <h2 className="text-2xl font-bold text-white">Últimos Resultados</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentResults.map((match) => (
                <Link
                  key={match.id}
                  href={`/${match.category.slug}`}
                  className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {match.category.name}
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      Finalizado
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                        {match.homeTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-zinc-200 truncate">{match.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-2xl font-black text-white">{match.homeScore ?? 0}</span>
                      <span className="text-zinc-600 text-sm">-</span>
                      <span className="text-2xl font-black text-white">{match.awayScore ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="font-semibold text-zinc-200 truncate text-right">{match.awayTeam.name}</span>
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                        {match.awayTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════ ACCESOS RÁPIDOS ═══════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
            <h2 className="text-2xl font-bold text-white">Acceso Rápido</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={`cls-${cat.id}`}
                href={`/${cat.slug}/clasificacion`}
                className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 hover:border-purple-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Clasificación {cat.name}</p>
                  <p className="text-xs text-zinc-500">Tabla de posiciones</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      </main>

    </div>
  )
}
