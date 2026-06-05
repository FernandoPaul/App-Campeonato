import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { Edit, Trash2, CalendarIcon, FileText } from "lucide-react"
import ExcelUploadButton from "@/components/admin/ExcelUploadButton"

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sParams = await searchParams
  const page = Number(sParams.page) || 1
  const categoryId = sParams.categoryId as string | undefined
  const status = sParams.status as string | undefined
  const matchStatus = sParams.matchStatus as string | undefined

  const take = 20
  const skip = (page - 1) * take

  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as any } : {}),
    ...(matchStatus ? { matchStatus: matchStatus as any } : {}),
  }

  const [matches, total, categories] = await Promise.all([
    prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        category: true,
        _count: { select: { events: true } },
      },
      orderBy: { matchDate: "desc" },
      skip,
      take,
    }),
    prisma.match.count({ where }),
    prisma.category.findMany(),
  ])

  const totalPages = Math.ceil(total / take)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Partidos</h2>
          <p className="text-zinc-400">Gestiona los encuentros y actualiza los resultados.</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExcelUploadButton />
          <Link
            href="/admin/partidos/nuevo"
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Nuevo Partido
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-wrap gap-4 items-end">
        <form className="flex flex-wrap gap-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
            <select
              name="categoryId"
              defaultValue={categoryId || ""}
              className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2"
            >
              <option value="">Todas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Estado Partido</label>
            <select
              name="matchStatus"
              defaultValue={matchStatus || ""}
              className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="SCHEDULED">Programado</option>
              <option value="LIVE">En Vivo</option>
              <option value="FINISHED">Finalizado</option>
              <option value="POSTPONED">Pospuesto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Visibilidad</label>
            <select
              name="status"
              defaultValue={status || ""}
              className="bg-zinc-800 border-zinc-700 rounded-md text-sm text-white px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Borrador</option>
            </select>
          </div>
          <div className="flex-1" />
          <button
            type="submit"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Partido</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Resultado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Jornada</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">Visibilidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900">
              {matches.map(match => (
                <tr key={match.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {match.matchDate
                      ? format(match.matchDate, "dd/MM/yyyy HH:mm")
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {match.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                    {match.forfeit && (
                      <span className="ml-2 text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                        FORFEIT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-white">
                    {match.homeScore ?? "—"} : {match.awayScore ?? "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 text-center">
                    {match.round || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${match.matchStatus === "LIVE"
                          ? "bg-red-500/10 text-red-400 ring-red-500/20 animate-pulse"
                          : match.matchStatus === "FINISHED"
                            ? "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                            : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                        }`}
                    >
                      {match.matchStatus === "LIVE" ? "En Vivo" :
                        match.matchStatus === "FINISHED" ? "Finalizado" :
                          match.matchStatus === "POSTPONED" ? "Pospuesto" : "Programado"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {match.status === "PUBLISHED" ? (
                      <span className="text-emerald-400 text-xs font-medium">Publicado</span>
                    ) : (
                      <span className="text-zinc-500 text-xs font-medium">Borrador</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2 items-center">
                      {/* Botón Vocalía — solo para partidos publicados */}
                      {match.status === "PUBLISHED" && (
                        <Link
                          href={`/admin/partidos/${match.id}/vocalia`}
                          className="relative text-purple-400 hover:text-purple-300 transition-colors"
                          title="Informe de Vocalía"
                        >
                          <FileText className="w-4 h-4" />
                          {match._count.events > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 rounded-full text-[8px] font-black text-white flex items-center justify-center">
                              {match._count.events}
                            </span>
                          )}
                        </Link>
                      )}
                      <Link
                        href={`/admin/partidos/${match.id}/editar`}
                        className="text-blue-400 hover:text-blue-300"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form
                        action={async () => {
                          "use server"
                          const { deleteMatch } = await import("./actions")
                          await deleteMatch(match.id)
                        }}
                      >
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
              {matches.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-zinc-500 text-sm"
                  >
                    No se encontraron partidos con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">
                Mostrando{" "}
                <span className="font-medium">{skip + 1}</span> a{" "}
                <span className="font-medium">{Math.min(skip + take, total)}</span> de{" "}
                <span className="font-medium">{total}</span> resultados
              </p>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link
                    key={i + 1}
                    href={`?page=${i + 1}${categoryId ? `&categoryId=${categoryId}` : ""}${status ? `&status=${status}` : ""
                      }${matchStatus ? `&matchStatus=${matchStatus}` : ""}`}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === i + 1
                        ? "z-10 bg-blue-600 text-white"
                        : "text-zinc-300 ring-1 ring-inset ring-zinc-700 hover:bg-zinc-800"
                      }`}
                  >
                    {i + 1}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}