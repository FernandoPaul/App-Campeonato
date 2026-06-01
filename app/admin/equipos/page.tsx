import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Edit, Trash2, CheckCircle2, Circle } from "lucide-react"
import { toggleTeamStatus, deleteTeam } from "./actions"
import TeamExcelUploadButton from "@/components/admin/TeamExcelUploadButton"

export default async function EquiposPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sParams = await searchParams;
  const categoryId = sParams.categoryId as string | undefined
  const status = sParams.status as string | undefined

  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as any } : {}),
  }

  const [equipos, categories] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: true,
        _count: {
          select: { homeMatches: true, awayMatches: true }
        }
      }
    }),
    prisma.category.findMany()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Equipos</h2>
          <p className="text-zinc-400">Gestiona los equipos que participan en los torneos.</p>
        </div>
        {/* ── Botones de acción ── */}
        <div className="flex items-center space-x-3">
          <TeamExcelUploadButton />
          <Link
            href="/admin/equipos/nuevo"
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Equipo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-wrap gap-4 items-end">
        <form className="flex flex-wrap gap-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
            <select name="categoryId" defaultValue={categoryId || ""} className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2">
              <option value="">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Visibilidad</label>
            <select name="status" defaultValue={status || ""} className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2">
              <option value="">Todos</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Borrador</option>
            </select>
          </div>
          <div className="flex-1" />
          <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Filtrar
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Equipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Partidos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Visibilidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900">
              {equipos.map((equipo) => {
                const totalMatches = equipo._count.homeMatches + equipo._count.awayMatches;
                return (
                  <tr key={equipo.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {equipo.logoUrl ? (
                          <img src={equipo.logoUrl} alt="" className="w-8 h-8 rounded-full bg-zinc-800 object-cover mr-3 border border-zinc-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mr-3 border border-zinc-700">
                            {equipo.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-white">{equipo.name}</div>
                          <div className="text-xs text-zinc-500">/{equipo.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-300">
                      {equipo.category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {equipo.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-300 font-medium">
                      {totalMatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <form action={async () => {
                        "use server"
                        await toggleTeamStatus(equipo.id, equipo.status)
                      }}>
                        <button
                          type="submit"
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${equipo.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                          {equipo.status === 'PUBLISHED' ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Publicado</>
                          ) : (
                            <><Circle className="w-3.5 h-3.5 mr-1" /> Borrador</>
                          )}
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3 items-center">
                        <Link href={`/admin/equipos/${equipo.id}/editar`} className="text-blue-400 hover:text-blue-300">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form action={async () => {
                          "use server"
                          await deleteTeam(equipo.id)
                        }}>
                          <button type="submit" className="text-red-400 hover:text-red-300" title="Eliminar" disabled={totalMatches > 0}>
                            <Trash2 className={`w-4 h-4 ${totalMatches > 0 ? 'opacity-30 cursor-not-allowed' : ''}`} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {equipos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No hay equipos creados con los filtros actuales.
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