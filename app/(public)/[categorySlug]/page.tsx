import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Calendar, BarChart2, ChevronLeft, Users } from "lucide-react"
import CategoryTabs from "@/components/public/CategoryTabs"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ categorySlug: string }>
}) {
    const p = await params
    const category = await prisma.category.findUnique({
        where: { slug: p.categorySlug, status: "PUBLISHED" },
    })
    if (!category) return {}
    return {
        title: `${category.name} — Campeonato`,
        description: `Calendario, clasificación y estadísticas de ${category.name}`,
    }
}

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ categorySlug: string }>
    searchParams: Promise<{ tab?: string; jornada?: string }>
}) {
    const p = await params
    const sp = await searchParams

    const category = await prisma.category.findUnique({
        where: { slug: p.categorySlug, status: "PUBLISHED" },
    })
    if (!category) notFound()

    const matches = await prisma.match.findMany({
        where: { categoryId: category.id, status: "PUBLISHED" },
        include: {
            homeTeam: true,
            awayTeam: true,
        },
        orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
    })

    const standings = await prisma.standing.findMany({
        where: { categoryId: category.id },
        include: { team: true },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
    })

    // Equipos de la categoría (para la pestaña Equipos)
    const teams = await prisma.team.findMany({
        where: { categoryId: category.id, status: "PUBLISHED" },
        orderBy: { name: "asc" },
    })

    // Estadísticas de jugadores para el pichichi
    // Solo contar goles de partidos FINISHED + PUBLISHED + NO forfeit
    const players = await prisma.player.findMany({
        where: { categoryId: category.id, status: "PUBLISHED" },
        include: {
            team: { select: { name: true } },
            matchEvents: {
                where: { type: { in: ["GOAL", "YELLOW_CARD", "RED_CARD", "DOUBLE_YELLOW"] } },
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

    const playerStats = players.map(player => {
        const validGoals = player.matchEvents.filter(
            e =>
                e.type === "GOAL" &&
                !e.match.forfeit &&
                e.match.status === "PUBLISHED" &&
                e.match.matchStatus === "FINISHED"
        ).length

        const yellowCards = player.matchEvents.filter(
            e => e.type === "YELLOW_CARD" && e.match.status === "PUBLISHED"
        ).length

        const redCards = player.matchEvents.filter(
            e => (e.type === "RED_CARD" || e.type === "DOUBLE_YELLOW") && e.match.status === "PUBLISHED"
        ).length

        return {
            playerId: player.id,
            playerName: `${player.firstName} ${player.lastName}`,
            dorsal: player.dorsal,
            teamName: player.team.name,
            goals: validGoals,
            yellowCards,
            redCards,
        }
    })

    const rounds = Array.from(
        new Set(matches.map(m => m.round).filter(Boolean))
    ) as string[]

    const activeTab = sp.tab || "calendario"
    const activeRound = sp.jornada || rounds[0] || null

    const filteredMatches =
        activeRound ? matches.filter(m => m.round === activeRound) : matches

    const tabs = [
        { key: "calendario", label: "Calendario", icon: Calendar },
        { key: "equipos", label: "Equipos", icon: Users },
        { key: "clasificacion", label: "Clasificación", icon: Trophy },
        { key: "estadisticas", label: "Estadísticas", icon: BarChart2, soon: true },
    ]

    return (
        <div className="max-w-5xl mx-auto space-y-0">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/5 pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
                <div className="relative px-6 py-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Volver al inicio
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                {category.name}
                            </h1>
                            <p className="text-sm text-zinc-400 capitalize mt-0.5">
                                {category.sport} · {matches.length} partidos · {standings.length} equipos
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Nav */}
            <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-1 mb-6">
                {tabs.map(({ key, label, icon: Icon, soon }) => (
                    <Link
                        key={key}
                        href={`/${category.slug}?tab=${key}`}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                            } ${soon ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                        {soon && (
                            <span className="hidden sm:inline text-[10px] font-bold bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Soon
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Content */}
            <CategoryTabs
                activeTab={activeTab}
                activeRound={activeRound}
                rounds={rounds}
                filteredMatches={filteredMatches}
                allMatches={matches}
                standings={standings}
                categorySlug={category.slug}
                teamsWithSlugs={teams}
                playerStats={playerStats}
            />
        </div>
    )
}