import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Calendar } from "lucide-react"
import MatchDateFilter from "@/components/public/MatchDateFilter"
import { parse } from "date-fns"

export const metadata = {
  title: "Partidos — Campeonato",
  description: "Todos los partidos de todas las competiciones",
}

export default async function GlobalPartidosPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams
  const selectedDateStr = searchParams.date

  let targetDate = new Date() // default to today
  if (selectedDateStr) {
    try {
      const parsed = parse(selectedDateStr, "yyyy-MM-dd", new Date())
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed
      }
    } catch (e) {
      // Ignorar si el formato es incorrecto
    }
  }

  // Set to start and end of the target day
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const matches = await prisma.match.findMany({
    where: { 
      status: "PUBLISHED",
      matchDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      category: true,
    },
    orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
  })

  // We no longer necessarily need to split into upcoming and finished strictly,
  // but we can still group them to make the UI look nice.
  const upcomingMatches = matches.filter(m => m.matchStatus === "SCHEDULED" || m.matchStatus === "POSTPONED" || m.matchStatus === "LIVE")
  const finishedMatches = matches.filter(m => m.matchStatus === "FINISHED").reverse()

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-transparent to-teal-600/5 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Partidos
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Encuentros programados y finalizados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CALENDARIO (FILTRO) ── */}
      <MatchDateFilter />

      {matches.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
          <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Sin partidos</h3>
          <p className="text-zinc-500 text-sm">No hay partidos programados para el día seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* ── PRÓXIMOS ── */}
          {upcomingMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                <h2 className="text-2xl font-bold text-white">Próximos Partidos</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/${match.category.slug}?tab=calendario`}
                    className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all group relative overflow-hidden"
                  >
                    {match.matchStatus === 'LIVE' && (
                       <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {match.category.name}
                      </span>
                      <span className="flex items-center gap-2">
                        {match.matchStatus === 'LIVE' && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                        <span className={`text-xs ${match.matchStatus === 'LIVE' ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                          {match.matchStatus === 'LIVE' ? 'En Vivo' : match.round || ""}
                        </span>
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
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(match.matchDate))
                          : "Hora por definir"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── RESULTADOS ── */}
          {finishedMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                <h2 className="text-2xl font-bold text-white">Resultados</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finishedMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/${match.category.slug}?tab=calendario`}
                    className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {match.category.name}
                      </span>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {match.round || "Finalizado"}
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
                        <span className={`text-2xl font-black ${match.homeScore! > match.awayScore! ? 'text-white' : 'text-zinc-500'}`}>
                          {match.homeScore ?? 0}
                        </span>
                        <span className="text-zinc-600 text-sm">-</span>
                        <span className={`text-2xl font-black ${match.awayScore! > match.homeScore! ? 'text-white' : 'text-zinc-500'}`}>
                          {match.awayScore ?? 0}
                        </span>
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
        </div>
      )}
    </div>
  )
}
