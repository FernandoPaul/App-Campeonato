"use client"

import { useActionState, useState } from "react"
import { createMatch, updateMatch } from "@/app/admin/partidos/actions"
import Link from "next/link"
import { Save, ArrowLeft } from "lucide-react"
import { Status, MatchStatus, Category, Team } from "@prisma/client"
import { format } from "date-fns"

type MatchFormProps = {
  categories: Category[]
  teams: Team[]
  initialData?: {
    id: string
    categoryId: string
    homeTeamId: string
    awayTeamId: string
    homeScore: number | null
    awayScore: number | null
    matchDate: Date | null
    round: string | null
    matchStatus: MatchStatus
    status: Status
  }
}

export default function MatchForm({ categories, teams, initialData }: MatchFormProps) {
  const isEditing = !!initialData
  
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.categoryId || "")
  
  // Filtrar equipos basados en la categoría seleccionada
  const filteredTeams = teams.filter(t => t.categoryId === selectedCategory)

  const action = isEditing 
    ? updateMatch.bind(null, initialData.id)
    : createMatch

  const [error, formAction, isPending] = useActionState(action, undefined)

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/partidos" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEditing ? "Editar Partido" : "Nuevo Partido"}
            </h2>
            <p className="text-zinc-400">
              {isEditing ? "Modifica los detalles o el resultado del partido" : "Registra un nuevo enfrentamiento manualmente"}
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Categoría */}
          <div className="sm:col-span-2">
            <label htmlFor="categoryId" className="block text-sm font-medium text-zinc-300">Categoría *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
            >
              <option value="" disabled>Selecciona una categoría primero</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Equipos */}
          <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Equipo Local</h3>
            <select
              name="homeTeamId"
              defaultValue={initialData?.homeTeamId || ""}
              required
              disabled={!selectedCategory}
              className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 disabled:opacity-50"
            >
              <option value="" disabled>Seleccionar Local</option>
              {filteredTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Goles Local</label>
              <input
                type="number"
                name="homeScore"
                min="0"
                defaultValue={initialData?.homeScore ?? ""}
                className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
                placeholder="-"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Equipo Visitante</h3>
            <select
              name="awayTeamId"
              defaultValue={initialData?.awayTeamId || ""}
              required
              disabled={!selectedCategory}
              className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 disabled:opacity-50"
            >
              <option value="" disabled>Seleccionar Visitante</option>
              {filteredTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Goles Visitante</label>
              <input
                type="number"
                name="awayScore"
                min="0"
                defaultValue={initialData?.awayScore ?? ""}
                className="block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
                placeholder="-"
              />
            </div>
          </div>

          {/* Fecha y Estado */}
          <div>
            <label htmlFor="matchDate" className="block text-sm font-medium text-zinc-300">Fecha y Hora</label>
            <input
              type="datetime-local"
              id="matchDate"
              name="matchDate"
              defaultValue={initialData?.matchDate ? format(new Date(initialData.matchDate), "yyyy-MM-dd'T'HH:mm") : ""}
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
            />
            <p className="mt-1 text-xs text-zinc-500">Opcional. Puedes dejarlo vacío si aún no está programado.</p>
          </div>

          <div>
            <label htmlFor="round" className="block text-sm font-medium text-zinc-300">Jornada o Fase</label>
            <input
              type="text"
              id="round"
              name="round"
              defaultValue={initialData?.round || ""}
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="Ej. Jornada 1, Semifinal, Grupo A..."
            />
          </div>

          <div>
            <label htmlFor="matchStatus" className="block text-sm font-medium text-zinc-300">Estado del Partido</label>
            <select
              id="matchStatus"
              name="matchStatus"
              defaultValue={initialData?.matchStatus || "SCHEDULED"}
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
            >
              <option value="SCHEDULED">Programado</option>
              <option value="LIVE">En Vivo</option>
              <option value="FINISHED">Finalizado</option>
              <option value="POSTPONED">Pospuesto</option>
            </select>
          </div>

          {/* Visibilidad */}
          <div className="sm:col-span-2">
            <label htmlFor="status" className="block text-sm font-medium text-zinc-300">Visibilidad Pública</label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.status || "DRAFT"}
              className="mt-2 block w-full md:w-1/2 rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
            >
              <option value="DRAFT">Oculto (Borrador)</option>
              <option value="PUBLISHED">Publicado (Visible)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              "Guardando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Guardar Partido" : "Crear Partido"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
