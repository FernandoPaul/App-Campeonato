"use client"

import { useActionState } from "react"
import { createTeam, updateTeam } from "@/app/admin/equipos/actions"
import Link from "next/link"
import { Save, ArrowLeft } from "lucide-react"
import { Status, Category } from "@prisma/client"

type TeamFormProps = {
  categories: Category[]
  initialData?: {
    id: string
    categoryId: string
    name: string
    slug: string
    city: string | null
    logoUrl: string | null
    status: Status
  }
}

export default function TeamForm({ categories, initialData }: TeamFormProps) {
  const isEditing = !!initialData
  
  const action = isEditing 
    ? updateTeam.bind(null, initialData.id)
    : createTeam

  const [error, formAction, isPending] = useActionState(action, undefined)

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/equipos" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEditing ? "Editar Equipo" : "Nuevo Equipo"}
            </h2>
            <p className="text-zinc-400">
              {isEditing ? "Actualiza los datos del equipo" : "Registra un nuevo equipo en una categoría"}
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="categoryId" className="block text-sm font-medium text-zinc-300">Categoría *</label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={initialData?.categoryId || ""}
              required
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
            >
              <option value="" disabled>Selecciona una categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Nombre del Equipo *</label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={initialData?.name}
              required
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="Ej. FC Barcelona"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-zinc-300">Slug (URL) *</label>
            <input
              type="text"
              id="slug"
              name="slug"
              defaultValue={initialData?.slug}
              required
              pattern="^[a-z0-9-]+$"
              title="Solo letras minúsculas, números y guiones"
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="ej. fc-barcelona"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-zinc-300">Ciudad</label>
            <input
              type="text"
              id="city"
              name="city"
              defaultValue={initialData?.city || ""}
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="Ej. Barcelona"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-300">Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.status || "DRAFT"}
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
            >
              <option value="DRAFT">Borrador (Oculto)</option>
              <option value="PUBLISHED">Publicado (Visible)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="logoUrl" className="block text-sm font-medium text-zinc-300">URL del Escudo/Logo</label>
            <input
              type="url"
              id="logoUrl"
              name="logoUrl"
              defaultValue={initialData?.logoUrl || ""}
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="https://ejemplo.com/logo.png"
            />
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
                {isEditing ? "Guardar Cambios" : "Crear Equipo"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
