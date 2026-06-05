import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import VocaliaForm from "@/components/admin/VocaliaForm"
import { format } from "date-fns"

export default async function VocaliaPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const match = await prisma.match.findUnique({
        where: { id },
        include: {
            homeTeam: {
                include: {
                    players: { orderBy: { dorsal: "asc" } },
                },
            },
            awayTeam: {
                include: {
                    players: { orderBy: { dorsal: "asc" } },
                },
            },
            category: true,
            events: {
                include: { player: true, team: true },
                orderBy: { createdAt: "asc" },
            },
        },
    })

    if (!match) notFound()

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/partidos" className="text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">Informe de Vocalía</h2>
                    </div>
                    <p className="text-zinc-400 text-sm mt-0.5">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                        {match.matchDate && ` · ${format(match.matchDate, "dd/MM/yyyy")}`}
                        {match.round && ` · ${match.round}`}
                    </p>
                </div>
            </div>

            {/* Marcador actual */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-white">{match.homeTeam.name}</p>
                        <p className="text-4xl font-black text-white mt-1">
                            {match.homeScore ?? "-"}
                        </p>
                    </div>
                    <div className="px-6">
                        <div className="text-zinc-500 text-sm font-medium text-center">VS</div>
                        {match.forfeit && (
                            <div className="mt-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full text-center">
                                FORFEIT
                            </div>
                        )}
                    </div>
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-white">{match.awayTeam.name}</p>
                        <p className="text-4xl font-black text-white mt-1">
                            {match.awayScore ?? "-"}
                        </p>
                    </div>
                </div>

                <div className="mt-3 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${match.matchStatus === "LIVE" ? "bg-red-500/10 text-red-400" :
                            match.matchStatus === "FINISHED" ? "bg-zinc-700 text-zinc-300" :
                                "bg-blue-500/10 text-blue-400"
                        }`}>
                        {match.matchStatus === "LIVE" ? "En Vivo" :
                            match.matchStatus === "FINISHED" ? "Finalizado" :
                                match.matchStatus === "POSTPONED" ? "Pospuesto" : "Programado"}
                    </span>
                </div>
            </div>

            {/* Formulario de eventos */}
            <VocaliaForm
                match={{
                    id: match.id,
                    forfeit: match.forfeit,
                    forfeitTeamId: match.forfeitTeamId,
                    homeTeam: {
                        id: match.homeTeam.id,
                        name: match.homeTeam.name,
                        players: match.homeTeam.players,
                    },
                    awayTeam: {
                        id: match.awayTeam.id,
                        name: match.awayTeam.name,
                        players: match.awayTeam.players,
                    },
                }}
                events={match.events.map(e => ({
                    id: e.id,
                    type: e.type,
                    teamName: e.team.name,
                    playerName: `${e.player.dorsal}. ${e.player.firstName} ${e.player.lastName}`,
                    createdAt: e.createdAt,
                }))}
            />
        </div>
    )
}