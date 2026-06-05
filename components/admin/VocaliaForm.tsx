"use client"

import { useActionState, useState, useTransition } from "react"
import { addMatchEvent, deleteMatchEvent } from "@/app/admin/partidos/[id]/vocalia/actions"
import { Trash2, ChevronDown, AlertTriangle } from "lucide-react"

type Player = { id: string; firstName: string; lastName: string; dorsal: number }
type Team = { id: string; name: string; players: Player[] }

type Event = {
    id: string
    type: string
    teamName: string
    playerName: string
}

type Props = {
    match: {
        id: string
        forfeit: boolean
        forfeitTeamId: string | null
        homeTeam: Team
        awayTeam: Team
    }
    events: Event[]
}

const EVENT_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    GOAL: {
        label: "Gol",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border border-emerald-500/30",
        icon: "⚽",
    },
    YELLOW_CARD: {
        label: "Tarjeta Amarilla",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10 border border-yellow-500/30",
        icon: "🟨",
    },
    RED_CARD: {
        label: "Tarjeta Roja",
        color: "text-red-400",
        bg: "bg-red-500/10 border border-red-500/30",
        icon: "🟥",
    },
    DOUBLE_YELLOW: {
        label: "Doble Amarilla (→ Roja)",
        color: "text-orange-400",
        bg: "bg-orange-500/10 border border-orange-500/30",
        icon: "🟨🟥",
    },
}

function DeleteButton({ eventId, matchId }: { eventId: string; matchId: string }) {
    const [pending, startTransition] = useTransition()

    return (
        <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => deleteMatchEvent(eventId, matchId))}
            className="text-red-400 hover:text-red-300 transition-colors p-1 disabled:opacity-40"
            title="Eliminar evento"
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    )
}

export default function VocaliaForm({ match, events }: Props) {
    const [selectedTeamId, setSelectedTeamId] = useState<string>(match.homeTeam.id)
    const [selectedType, setSelectedType] = useState<string>("")
    const [state, formAction, isPending] = useActionState(addMatchEvent, undefined)

    const selectedTeam =
        selectedTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam

    const goalEvents = events.filter(e => e.type === "GOAL")
    const cardEvents = events.filter(e => e.type !== "GOAL")

    return (
        <div className="space-y-6">
            {/* Aviso forfeit */}
            {match.forfeit && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-orange-300 font-semibold text-sm">Partido con forfeit</p>
                        <p className="text-orange-400/70 text-xs mt-1">
                            Los goles de este informe{" "}
                            <strong>no contarán</strong> en las estadísticas individuales de
                            los jugadores. El resultado oficial es 3–0 por sanción.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── FORMULARIO ── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                    <h3 className="text-base font-bold text-white">Añadir evento</h3>

                    <form action={formAction} className="space-y-5">
                        <input type="hidden" name="matchId" value={match.id} />
                        <input type="hidden" name="teamId" value={selectedTeamId} />

                        {/* Selección de equipo */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                Equipo
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[match.homeTeam, match.awayTeam].map(team => (
                                    <button
                                        key={team.id}
                                        type="button"
                                        onClick={() => setSelectedTeamId(team.id)}
                                        className={`px-3 py-2.5 rounded-lg text-sm font-semibold text-center transition-all border ${selectedTeamId === team.id
                                                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20"
                                                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500"
                                            }`}
                                    >
                                        {team.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selección de jugador */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                Jugador
                            </label>
                            <div className="relative">
                                <select
                                    name="playerId"
                                    required
                                    className="block w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 appearance-none focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">Seleccionar jugador...</option>
                                    {selectedTeam.players.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.dorsal}. {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                            {selectedTeam.players.length === 0 && (
                                <p className="text-xs text-amber-400/80 mt-1.5">
                                    ⚠ Este equipo no tiene jugadores registrados.
                                </p>
                            )}
                        </div>

                        {/* Tipo de evento */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                Tipo de evento
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(EVENT_LABELS).map(([key, val]) => (
                                    <label
                                        key={key}
                                        className={`flex items-center gap-2.5 p-3 rounded-lg cursor-pointer transition-all ${selectedType === key
                                                ? val.bg + " ring-1 ring-inset ring-white/10"
                                                : "bg-zinc-800/60 border border-zinc-700 hover:border-zinc-500"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={key}
                                            required
                                            checked={selectedType === key}
                                            onChange={() => setSelectedType(key)}
                                            className="sr-only"
                                        />
                                        <span className="text-lg leading-none">{val.icon}</span>
                                        <span className={`text-xs font-semibold ${val.color}`}>
                                            {val.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        {state?.error && (
                            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {state.error}
                            </p>
                        )}
                        {state?.success && (
                            <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                {state.success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isPending ? "Registrando..." : "Registrar Evento"}
                        </button>
                    </form>
                </div>

                {/* ── EVENTOS REGISTRADOS ── */}
                <div className="space-y-4">
                    {/* Goles */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <span>⚽</span>
                            <span>Goles ({goalEvents.length})</span>
                            {match.forfeit && (
                                <span className="text-xs text-orange-400 font-normal ml-1">
                                    (no cuentan en estadísticas)
                                </span>
                            )}
                        </h3>
                        {goalEvents.length === 0 ? (
                            <p className="text-zinc-600 text-xs italic">Sin goles registrados.</p>
                        ) : (
                            <ul className="space-y-2">
                                {goalEvents.map(e => (
                                    <li
                                        key={e.id}
                                        className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800/60 last:border-0"
                                    >
                                        <div>
                                            <span className="text-white font-semibold">{e.playerName}</span>
                                            <span className="text-zinc-400 ml-2 text-xs">({e.teamName})</span>
                                        </div>
                                        <DeleteButton eventId={e.id} matchId={match.id} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Tarjetas */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-white mb-3">
                            Tarjetas ({cardEvents.length})
                        </h3>
                        {cardEvents.length === 0 ? (
                            <p className="text-zinc-600 text-xs italic">Sin tarjetas registradas.</p>
                        ) : (
                            <ul className="space-y-2">
                                {cardEvents.map(e => {
                                    const info = EVENT_LABELS[e.type]
                                    return (
                                        <li
                                            key={e.id}
                                            className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800/60 last:border-0"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-base leading-none">{info?.icon}</span>
                                                <div>
                                                    <span className="text-white font-semibold">
                                                        {e.playerName}
                                                    </span>
                                                    <span className="text-zinc-400 ml-2 text-xs">
                                                        ({e.teamName})
                                                    </span>
                                                </div>
                                            </div>
                                            <DeleteButton eventId={e.id} matchId={match.id} />
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Resumen rápido */}
                    {events.length > 0 && (
                        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                                Resumen del partido
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[match.homeTeam, match.awayTeam].map(team => {
                                    const teamGoals = goalEvents.filter(e => e.teamName === team.name).length
                                    const teamYellows = events.filter(
                                        e => e.type === "YELLOW_CARD" && e.teamName === team.name
                                    ).length
                                    const teamDoubleYellows = events.filter(
                                        e => e.type === "DOUBLE_YELLOW" && e.teamName === team.name
                                    ).length
                                    const teamReds = events.filter(
                                        e => e.type === "RED_CARD" && e.teamName === team.name
                                    ).length

                                    return (
                                        <div key={team.id} className="space-y-1.5">
                                            <p className="text-xs font-bold text-zinc-300 truncate">{team.name}</p>
                                            <div className="flex gap-3 text-xs">
                                                <span className="text-emerald-400">⚽ {teamGoals}</span>
                                                <span className="text-yellow-400">🟨 {teamYellows}</span>
                                                {teamDoubleYellows > 0 && (
                                                    <span className="text-orange-400">🟨🟥 {teamDoubleYellows}</span>
                                                )}
                                                <span className="text-red-400">🟥 {teamReds}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}