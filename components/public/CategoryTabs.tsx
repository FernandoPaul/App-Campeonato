"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Team = { id: string; name: string; logoUrl: string | null; slug: string }

type Match = {
    id: string
    homeTeamId: string
    awayTeamId: string
    homeScore: number | null
    awayScore: number | null
    matchDate: Date | null
    round: string | null
    matchStatus: string
    homeTeam: Team
    awayTeam: Team
}

type Standing = {
    id: string
    teamId: string
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
    team: Team
}

type PlayerStat = {
    playerId: string
    playerName: string
    dorsal: number
    teamName: string
    goals: number
    yellowCards: number
    redCards: number
}

type Props = {
    activeTab: string
    activeRound: string | null
    rounds: string[]
    filteredMatches: Match[]
    allMatches: Match[]
    standings: Standing[]
    categorySlug: string
    teamsWithSlugs: Team[]
    playerStats: PlayerStat[]
}

function TeamAvatar({ team }: { team: { name: string; logoUrl: string | null } }) {
    if (team.logoUrl) {
        return (
            <img
                src={team.logoUrl}
                alt={team.name}
                className="w-8 h-8 rounded-full object-cover border border-zinc-700"
            />
        )
    }
    return (
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-400 flex-shrink-0">
            {team.name.substring(0, 2).toUpperCase()}
        </div>
    )
}

function MatchCard({ match }: { match: Match }) {
    const isFinished = match.matchStatus === "FINISHED"
    const isLive = match.matchStatus === "LIVE"

    const homeWin = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
    const awayWin = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore

    return (
        <div className={`relative bg-zinc-900/80 border rounded-xl overflow-hidden transition-all hover:border-zinc-600 ${isLive ? "border-red-500/40" : "border-zinc-800/60"}`}>
            {isLive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />
            )}
            <div className="px-4 py-3 flex items-center gap-3">
                <div className={`flex items-center gap-2.5 flex-1 min-w-0 ${awayWin ? "opacity-50" : ""}`}>
                    <TeamAvatar team={match.homeTeam} />
                    <span className={`text-sm font-semibold truncate ${homeWin ? "text-white" : "text-zinc-300"}`}>
                        {match.homeTeam.name}
                    </span>
                </div>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[72px]">
                    {isFinished || isLive ? (
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-black tabular-nums ${homeWin ? "text-white" : "text-zinc-300"}`}>
                                {match.homeScore ?? 0}
                            </span>
                            <span className="text-zinc-600 text-sm">—</span>
                            <span className={`text-xl font-black tabular-nums ${awayWin ? "text-white" : "text-zinc-300"}`}>
                                {match.awayScore ?? 0}
                            </span>
                        </div>
                    ) : (
                        <span className="text-zinc-500 text-xs font-medium">
                            {match.matchDate ? format(new Date(match.matchDate), "HH:mm") : "vs"}
                        </span>
                    )}
                    <div className="mt-1">
                        {isLive ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                </span>
                                Live
                            </span>
                        ) : isFinished ? (
                            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Final</span>
                        ) : (
                            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
                                {match.matchDate ? format(new Date(match.matchDate), "d MMM", { locale: es }) : "Prog."}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`flex items-center gap-2.5 flex-1 min-w-0 justify-end ${homeWin ? "opacity-50" : ""}`}>
                    <span className={`text-sm font-semibold truncate text-right ${awayWin ? "text-white" : "text-zinc-300"}`}>
                        {match.awayTeam.name}
                    </span>
                    <TeamAvatar team={match.awayTeam} />
                </div>
            </div>
        </div>
    )
}

export default function CategoryTabs({
    activeTab,
    activeRound,
    rounds,
    filteredMatches,
    allMatches,
    standings,
    categorySlug,
    teamsWithSlugs,
    playerStats,
}: Props) {
    const currentRoundIdx = activeRound ? rounds.indexOf(activeRound) : 0
    const prevRound = currentRoundIdx > 0 ? rounds[currentRoundIdx - 1] : null
    const nextRound = currentRoundIdx < rounds.length - 1 ? rounds[currentRoundIdx + 1] : null

    // ── EQUIPOS ──
    if (activeTab === "equipos") {
        const sortedTeams = [...teamsWithSlugs].sort((a, b) => a.name.localeCompare(b.name))
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedTeams.map(team => (
                    <Link
                        key={team.id}
                        href={`/${categorySlug}/equipos/${team.slug}`}
                        className="group bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-600 transition-all flex items-center gap-3"
                    >
                        <TeamAvatar team={team} />
                        <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                            {team.name}
                        </span>
                    </Link>
                ))}
                {sortedTeams.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-zinc-600 text-sm">
                        No hay equipos registrados en esta categoría.
                    </div>
                )}
            </div>
        )
    }

    // ── CLASIFICACIÓN ──
    if (activeTab === "clasificacion") {
        const scorers = [...playerStats]
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10)

        return (
            <div className="space-y-6">
                {/* Tabla de clasificación */}
                <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-zinc-950/60 border-b border-zinc-800/60">
                                    <th className="pl-4 pr-2 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest w-8">#</th>
                                    <th className="px-2 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Equipo</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest">PJ</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:table-cell">G</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:table-cell">E</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:table-cell">P</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">GF</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">GC</th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">DG</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-blue-400 uppercase tracking-widest">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {standings.map((s, idx) => {
                                    const diff = s.goalsFor - s.goalsAgainst
                                    const isTop3 = idx < 3
                                    return (
                                        <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="pl-4 pr-2 py-3.5 w-8">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                                        idx === 1 ? "bg-zinc-400/15 text-zinc-400" :
                                                            idx === 2 ? "bg-orange-700/20 text-orange-500" : "text-zinc-500"
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                            </td>
                                            <td className="px-2 py-3.5">
                                                <Link
                                                    href={`/${categorySlug}/equipos/${s.team.slug}`}
                                                    className="flex items-center gap-2.5 hover:underline"
                                                >
                                                    {s.team.logoUrl ? (
                                                        <img src={s.team.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-700" />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                            {s.team.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className={`text-sm font-semibold ${isTop3 ? "text-white" : "text-zinc-300"}`}>
                                                        {s.team.name}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3.5 text-center text-sm text-zinc-300 font-medium tabular-nums">{s.played}</td>
                                            <td className="px-3 py-3.5 text-center text-sm text-zinc-400 tabular-nums hidden sm:table-cell">{s.won}</td>
                                            <td className="px-3 py-3.5 text-center text-sm text-zinc-400 tabular-nums hidden sm:table-cell">{s.drawn}</td>
                                            <td className="px-3 py-3.5 text-center text-sm text-zinc-400 tabular-nums hidden sm:table-cell">{s.lost}</td>
                                            <td className="px-3 py-3.5 text-center text-sm text-zinc-400 tabular-nums hidden md:table-cell">{s.goalsFor}</td>
                                            <td className="px-3 py-3.5 text-center text-sm text-zinc-400 tabular-nums hidden md:table-cell">{s.goalsAgainst}</td>
                                            <td className="px-3 py-3.5 text-center text-sm tabular-nums hidden md:table-cell">
                                                <span className={diff > 0 ? "text-emerald-400 font-medium" : diff < 0 ? "text-red-400 font-medium" : "text-zinc-400"}>
                                                    {diff > 0 ? `+${diff}` : diff}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-base font-black text-blue-400 tabular-nums">{s.points}</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {standings.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-16 text-center text-zinc-600 text-sm">
                                            Aún no hay clasificación disponible.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pichichi */}
                {scorers.length > 0 && (
                    <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800/60">
                            <h3 className="text-base font-bold text-white">⚽ Pichichi</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-zinc-950/40 border-b border-zinc-800/40">
                                        <th className="pl-5 pr-2 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest w-8">#</th>
                                        <th className="px-2 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Jugador</th>
                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Equipo</th>
                                        <th className="px-4 py-2.5 text-center text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Goles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/40">
                                    {scorers.map((p, idx) => (
                                        <tr key={p.playerId} className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="pl-5 pr-2 py-3 text-sm font-bold text-zinc-500">{idx + 1}</td>
                                            <td className="px-2 py-3">
                                                <div>
                                                    <span className="text-sm font-semibold text-white">{p.playerName}</span>
                                                    <span className="ml-2 text-xs text-zinc-600">#{p.dorsal}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-zinc-400">{p.teamName}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-base font-black text-emerald-400 tabular-nums">{p.goals}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ── CALENDARIO ──
    return (
        <div className="space-y-4">
            {rounds.length > 0 && (
                <div className="flex items-center gap-2">
                    {prevRound ? (
                        <Link href={`/${categorySlug}?tab=calendario&jornada=${encodeURIComponent(prevRound)}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all flex-shrink-0">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                    ) : <div className="w-8 h-8 flex-shrink-0" />}

                    <div className="flex-1 overflow-x-auto scrollbar-none">
                        <div className="flex gap-2 pb-0.5 min-w-max mx-auto justify-start sm:justify-center">
                            {rounds.map(round => (
                                <Link key={round}
                                    href={`/${categorySlug}?tab=calendario&jornada=${encodeURIComponent(round)}`}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeRound === round
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}>
                                    {round}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {nextRound ? (
                        <Link href={`/${categorySlug}?tab=calendario&jornada=${encodeURIComponent(nextRound)}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all flex-shrink-0">
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : <div className="w-8 h-8 flex-shrink-0" />}
                </div>
            )}

            {filteredMatches.length > 0 ? (
                <div className="space-y-2.5">
                    {filteredMatches.map(match => <MatchCard key={match.id} match={match} />)}
                </div>
            ) : (
                <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl py-16 text-center">
                    <p className="text-zinc-600 text-sm">
                        No hay partidos disponibles{activeRound ? ` para ${activeRound}` : ""}.
                    </p>
                </div>
            )}
        </div>
    )
}