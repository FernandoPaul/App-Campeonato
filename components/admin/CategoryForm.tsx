"use client"

import { useActionState } from "react"
import { createCategory, updateCategory } from "@/app/admin/categorias/actions"
import Link from "next/link"
import { Save, ArrowLeft } from "lucide-react"
import { Status } from "@prisma/client"

type CategoryFormProps = {
  initialData?: {
    id: string
    name: string
    slug: string
    sport: string
    logoUrl: string | null
    status: Status
  }
}

export default function CategoryForm({ initialData }: CategoryFormProps) {
  const isEditing = !!initialData
  
  // En Next.js 15, usamos bind para pasar argumentos adicionales a la server action
  const action = isEditing 
    ? updateCategory.bind(null, initialData.id)
    : createCategory

  const [error, formAction, isPending] = useActionState(action, undefined)

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/categorias" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEditing ? "Editar Categoría" : "Nueva Categoría"}
            </h2>
            <p className="text-zinc-400">
              {isEditing ? "Actualiza los datos de esta categoría" : "Crea una nueva categoría para agrupar equipos y partidos"}
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
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={initialData?.name}
              required
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="Ej. Primera División"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-zinc-300">Slug (URL)</label>
            <input
              type="text"
              id="slug"
              name="slug"
              defaultValue={initialData?.slug}
              required
              pattern="^[a-z0-9-]+$"
              title="Solo letras minúsculas, números y guiones"
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="ej. primera-division"
            />
            <p className="mt-1 text-xs text-zinc-500">Usado en las URLs (no debe repetirse)</p>
          </div>

          <div>
            <label htmlFor="sport" className="block text-sm font-medium text-zinc-300">Deporte</label>
            <input
              type="text"
              id="sport"
              name="sport"
              defaultValue={initialData?.sport}
              required
              className="mt-2 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
              placeholder="Ej. Fútbol"
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
            <label htmlFor="logoUrl" className="block text-sm font-medium text-zinc-300">URL del Logo (Opcional)</label>
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
                {isEditing ? "Guardar Cambios" : "Crear Categoría"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
