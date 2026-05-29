import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { Plus, Edit, Trash2, CheckCircle2, Circle } from "lucide-react"
import { toggleCategoryStatus, deleteCategory } from "./actions"

export default async function CategoriasPage() {
  const categorias = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { teams: true, matches: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Categorías</h2>
          <p className="text-zinc-400">Gestiona las ligas, torneos y categorías.</p>
        </div>
        <Link
          href="/admin/categorias/nueva"
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Deporte</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Equipos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Partidos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Visibilidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900">
              {categorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {categoria.logoUrl ? (
                        <img src={categoria.logoUrl} alt="" className="w-8 h-8 rounded-full bg-zinc-800 object-cover mr-3" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mr-3 border border-zinc-700">
                          {categoria.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">{categoria.name}</div>
                        <div className="text-xs text-zinc-500">/{categoria.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {categoria.sport}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-300 font-medium">
                    {categoria._count.teams}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-300 font-medium">
                    {categoria._count.matches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <form action={async () => {
                      "use server"
                      await toggleCategoryStatus(categoria.id, categoria.status)
                    }}>
                      <button 
                        type="submit" 
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${
                          categoria.status === 'PUBLISHED' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {categoria.status === 'PUBLISHED' ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Publicado</>
                        ) : (
                          <><Circle className="w-3.5 h-3.5 mr-1" /> Borrador</>
                        )}
                      </button>
                    </form>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3 items-center">
                      <Link href={`/admin/categorias/${categoria.id}/editar`} className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={async () => {
                        "use server"
                        await deleteCategory(categoria.id)
                      }}>
                        <button type="submit" className="text-red-400 hover:text-red-300" title="Eliminar" disabled={categoria._count.teams > 0 || categoria._count.matches > 0}>
                          <Trash2 className={`w-4 h-4 ${categoria._count.teams > 0 || categoria._count.matches > 0 ? 'opacity-30 cursor-not-allowed' : ''}`} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No hay categorías creadas todavía.
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
