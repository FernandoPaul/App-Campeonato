import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Edit, Trash2 } from "lucide-react"
import { deletePlayer } from "./actions"
import PlayerExcelUploadButton from "@/components/admin/PlayerExcelUploadButton"

export default async function JugadoresPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sParams = await searchParams
    const categoryId = sParams.categoryId as string | undefined
    const teamId = sParams.teamId as string | undefined

    const where = {
        ...(categoryId ? { categoryId } : {}),
        ...(teamId ? { teamId } : {}),
    }

    const [jugadores, categories, teams] = await Promise.all([
        prisma.player.findMany({
            where,
            orderBy: [{ team: { name: "asc" } }, { dorsal: "asc" }],
            include: { team: true, category: true },
        }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.team.findMany({
            where: categoryId ? { categoryId } : {},
            orderBy: { name: "asc" },
        }),
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Jugadores</h2>
                    <p className="text-zinc-400">Gestiona los jugadores por equipo y categoría.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <PlayerExcelUploadButton />
                    <Link
                        href="/admin/jugadores/nuevo"
                        className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Jugador
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <form className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
                        <select
                            name="categoryId"
                            defaultValue={categoryId || ""}
                            className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2"
                        >
                            <option value="">Todas</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Equipo</label>
                        <select
                            name="teamId"
                            defaultValue={teamId || ""}
                            className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2"
                        >
                            <option value="">Todos</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Filtrar
                    </button>
                </form>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-zinc-950/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-16">Dorsal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Jugador</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Equipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                            {jugadores.map((jugador) => (
                                <tr key={jugador.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-black text-zinc-300">
                                            {jugador.dorsal}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-white">
                                            {jugador.firstName} {jugador.lastName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                        {jugador.team.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {jugador.category.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3 items-center">
                                            <Link
                                                href={`/admin/jugadores/${jugador.id}/editar`}
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <form action={async () => {
                                                "use server"
                                                await deletePlayer(jugador.id)
                                            }}>
                                                <button
                                                    type="submit"
                                                    className="text-red-400 hover:text-red-300"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {jugadores.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                                        No hay jugadores con los filtros actuales.
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