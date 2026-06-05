"use client"

import { useActionState, useState } from "react"
import { createPlayer, updatePlayer } from "@/app/admin/jugadores/actions"
import Link from "next/link"
import { Save, ArrowLeft } from "lucide-react"
import { Status, Category, Team } from "@prisma/client"

type PlayerFormProps = {
    categories: Category[]
    teams: Team[]
    initialData?: {
        id: string
        teamId: string
        categoryId: string
        firstName: string
        lastName: string
        dorsal: number
        status: Status
    }
}

export default function PlayerForm({ categories, teams, initialData }: PlayerFormProps) {
    const isEditing = !!initialData
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId || "")

    const filteredTeams = teams.filter(t => t.categoryId === selectedCategoryId)

    const action = isEditing
        ? updatePlayer.bind(null, initialData.id)
        : createPlayer

    const [error, formAction, isPending] = useActionState(action, undefined)

    return (
        <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/jugadores" className="text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {isEditing ? "Editar Jugador" : "Nuevo Jugador"}
                    </h2>
                    <p className="text-zinc-400">
                        {isEditing ? "Actualiza los datos del jugador" : "Registra un nuevo jugador en un equipo"}
                    </p>
                </div>
            </div>

            <form action={formAction} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Categoría */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Categoría *</label>
                    <select
                        name="categoryId"
                        value={selectedCategoryId}
                        onChange={e => setSelectedCategoryId(e.target.value)}
                        required
                        className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white text-sm px-4 py-2"
                    >
                        <option value="" disabled>Selecciona una categoría</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Equipo */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Equipo *</label>
                    <select
                        name="teamId"
                        defaultValue={initialData?.teamId || ""}
                        required
                        disabled={!selectedCategoryId}
                        className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white text-sm px-4 py-2 disabled:opacity-50"
                    >
                        <option value="" disabled>Selecciona un equipo</option>
                        {filteredTeams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre *</label>
                        <input
                            type="text"
                            name="firstName"
                            defaultValue={initialData?.firstName}
                            required
                            className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white text-sm px-4 py-2"
                            placeholder="Juan"
                        />
                    </div>

                    {/* Apellido */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Apellido *</label>
                        <input
                            type="text"
                            name="lastName"
                            defaultValue={initialData?.lastName}
                            required
                            className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white text-sm px-4 py-2"
                            placeholder="García"
                        />
                    </div>
                </div>

                {/* Dorsal */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Dorsal *</label>
                    <input
                        type="number"
                        name="dorsal"
                        min={1}
                        max={99}
                        defaultValue={initialData?.dorsal}
                        required
                        className="block w-32 rounded-md bg-zinc-800 border-zinc-700 text-white text-sm px-4 py-2"
                        placeholder="7"
                    />
                    <p className="mt-1 text-xs text-zinc-500">Entre 1 y 99, único dentro del equipo.</p>
                </div>

                {/* Estado */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Estado</label>
                    <select
                        name="status"
                        defaultValue={initialData?.status || "PUBLISHED"}
                        className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white text-sm px-4 py-2"
                    >
                        <option value="PUBLISHED">Activo</option>
                        <option value="DRAFT">Inactivo</option>
                    </select>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? "Guardando..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? "Guardar Cambios" : "Crear Jugador"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}