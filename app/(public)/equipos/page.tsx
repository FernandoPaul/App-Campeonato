import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Users, MapPin, Trophy } from "lucide-react"

export const metadata = {
  title: "Equipos — Campeonato",
  description: "Todos los equipos que participan en las distintas competiciones",
}

export default async function GlobalEquiposPage() {
  const teams = await prisma.team.findMany({
    where: { status: "PUBLISHED", category: { status: "PUBLISHED" } },
    include: {
      category: true,
      _count: {
        select: { homeMatches: true, awayMatches: true }
      }
    },
    orderBy: { name: "asc" },
  })

  // Agrupar por competición para organizarlos visualmente mejor
  const teamsByCategory = teams.reduce((acc, team) => {
    if (!acc[team.category.name]) {
      acc[team.category.name] = []
    }
    acc[team.category.name].push(team)
    return acc
  }, {} as Record<string, typeof teams>)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Todos los Equipos
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {teams.length} equipos inscritos en {Object.keys(teamsByCategory).length} competiciones
            </p>
          </div>
        </div>
      </div>

      {/* ── LISTADO AGRUPADO ── */}
      {Object.entries(teamsByCategory).map(([categoryName, categoryTeams]) => (
        <section key={categoryName}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {categoryName}
              <span className="text-sm font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full ml-2">
                {categoryTeams.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryTeams.map((team) => (
              <Link
                key={team.id}
                href={`/${team.category.slug}`}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 hover:border-blue-500/30 hover:bg-zinc-900 transition-all group flex flex-col items-center text-center"
              >
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} className="w-16 h-16 rounded-full bg-zinc-800 object-cover mb-4 border-2 border-zinc-800 group-hover:border-blue-500/30 transition-colors" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xl font-bold text-zinc-500 mb-4 border-2 border-zinc-800 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                <h3 className="font-bold text-zinc-200 group-hover:text-white mb-1 transition-colors">{team.name}</h3>
                
                {team.city && (
                  <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    {team.city}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}

      {teams.length === 0 && (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No hay equipos</h3>
          <p className="text-zinc-500 text-sm">Los equipos publicados aparecerán aquí.</p>
        </div>
      )}
    </div>
  )
}
