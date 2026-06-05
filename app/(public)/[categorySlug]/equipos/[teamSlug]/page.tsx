import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ categorySlug: string; teamSlug: string }>
}) {
    const p = await params
    const team = await prisma.team.findUnique({ where: { slug: p.teamSlug } })
    if (!team) return {}
    return { title: `${team.name} — Campeonato` }
}

export default async function TeamPage({
    params,
}: {
    params: Promise<{ categorySlug: string; teamSlug: string }>
}) {
    const p = await params

    const category = await prisma.category.findUnique({
        where: { slug: p.categorySlug, status: "PUBLISHED" },
    })
    if (!category) notFound()

    const team = await prisma.team.findUnique({
        where: { slug: p.teamSlug },
    })
    if (!team || team.categoryId !== category.id) notFound()

    // Jugadores con estadísticas
    const players = await prisma.player.findMany({
        where: { teamId: team.id, status: "PUBLISHED" },
        orderBy: { dorsal: "asc" },
        include: {
            matchEvents: {
                include: {
                    match: {
                        select: {
                            forfeit: true,
                            forfeitTeamId: true,
                            status: true,
                            matchStatus: true,
                        },
                    },
                },
            },
        },
    })

    // Partidos del equipo (publicados)
    const matches = await prisma.match.findMany({
        where: {
            status: "PUBLISHED",
            OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
        },
        include: {
            homeTeam: true,
            awayTeam: true,
        },
        orderBy: { matchDate: "asc" },
    })

    // Calcular estadísticas por jugador (excluyendo eventos de partidos forfeit)
    const playerStats = players.map(player => {
        const validEvents = player.matchEvents.filter(event => {
            // Excluir goles si el partido es forfeit
            if (event.type === "GOAL" && event.match.forfeit) return false
            // Solo contar eventos de partidos publicados y finalizados
            if (event.match.status !== "PUBLISHED") return false
            return true
        })

        return {
            id: player.id,
            dorsal: player.dorsal,
            name: `${player.firstName} ${player.lastName}`,
            goals: validEvents.filter(e => e.type === "GOAL").length,
            yellowCards: validEvents.filter(e => e.type === "YELLOW_CARD").length,
            redCards: validEvents.filter(e => e.type === "RED_CARD" || e.type === "DOUBLE_YELLOW").length,
        }
    })

    const now = new Date()
    const pastMatches = matches.filter(
        m => m.matchStatus === "FINISHED" || (m.matchDate && m.matchDate < now)
    )
    const upcomingMatches = matches.filter(
        m => m.matchStatus === "SCHEDULED" && (!m.matchDate || m.matchDate >= now)
    )

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/5 pointer-events-none" />
                <div className="relative px-6 py-8">
                    <Link
                        href={`/${category.slug}?tab=equipos`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Volver a {category.name}
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-2xl font-black text-zinc-400">
                            {team.logoUrl ? (
                                <img src={team.logoUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                team.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">{team.name}</h1>
                            <p className="text-sm text-zinc-400 mt-0.5">
                                {category.name}
                                {team.city && ` · ${team.city}`}
                                {` · ${players.length} jugadores`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plantilla y estadísticas */}
            <section>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                    <h2 className="text-xl font-bold text-white">Plantilla</h2>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-zinc-950/60 border-b border-zinc-800/60">
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest w-16">Dorsal</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Jugador</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest">⚽ Goles</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest">🟨 Amarillas</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest">🟥 Rojas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {playerStats.map(p => (
                                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-black text-zinc-300">
                                                {p.dorsal}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm font-semibold text-white">{p.name}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`text-sm font-bold tabular-nums ${p.goals > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                                                {p.goals}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`text-sm font-bold tabular-nums ${p.yellowCards > 0 ? "text-yellow-400" : "text-zinc-500"}`}>
                                                {p.yellowCards}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`text-sm font-bold tabular-nums ${p.redCards > 0 ? "text-red-400" : "text-zinc-500"}`}>
                                                {p.redCards}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {playerStats.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 text-sm">
                                            No hay jugadores registrados en este equipo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Calendario completo */}
            <section>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                    <h2 className="text-xl font-bold text-white">Calendario</h2>
                </div>

                <div className="space-y-6">
                    {pastMatches.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Resultados</h3>
                            <div className="space-y-2">
                                {[...pastMatches].reverse().map(match => (
                                    <TeamMatchCard key={match.id} match={match} teamId={team.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {upcomingMatches.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Próximos partidos</h3>
                            <div className="space-y-2">
                                {upcomingMatches.map(match => (
                                    <TeamMatchCard key={match.id} match={match} teamId={team.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {matches.length === 0 && (
                        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl py-12 text-center">
                            <p className="text-zinc-600 text-sm">No hay partidos registrados.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

function TeamMatchCard({
    match,
    teamId,
}: {
    match: any
    teamId: string
}) {
    const isHome = match.homeTeamId === teamId
    const opponent = isHome ? match.awayTeam : match.homeTeam
    const myScore = isHome ? match.homeScore : match.awayScore
    const theirScore = isHome ? match.awayScore : match.homeScore
    const isFinished = match.matchStatus === "FINISHED"
    const isLive = match.matchStatus === "LIVE"

    let resultBadge = null
    if (isFinished && myScore !== null && theirScore !== null) {
        if (myScore > theirScore) resultBadge = { label: "V", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }
        else if (myScore < theirScore) resultBadge = { label: "D", cls: "bg-red-500/15 text-red-400 border-red-500/20" }
        else resultBadge = { label: "E", cls: "bg-zinc-700 text-zinc-300 border-zinc-600" }
    }

    return (
        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {resultBadge && (
                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-full border flex-shrink-0 ${resultBadge.cls}`}>
                        {resultBadge.label}
                    </span>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                        {isHome ? "vs" : "@"} {opponent.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {match.round && `${match.round} · `}
                        {match.matchDate
                            ? format(new Date(match.matchDate), "d MMM yyyy", { locale: es })
                            : "Fecha por definir"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                {isFinished || isLive ? (
                    <span className="text-lg font-black text-white tabular-nums">
                        {myScore ?? 0} — {theirScore ?? 0}
                    </span>
                ) : (
                    <span className="text-xs text-zinc-500 font-medium">
                        {isLive ? "En Vivo" : match.matchStatus === "POSTPONED" ? "Pospuesto" : "Programado"}
                    </span>
                )}
                {match.forfeit && (
                    <span className="text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                        FORFEIT
                    </span>
                )}
            </div>
        </div>
    )
}