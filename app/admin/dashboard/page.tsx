import { prisma } from "@/lib/prisma"
import { Trophy, Users, Calendar } from "lucide-react"

export default async function DashboardPage() {
  const [categoriesCount, teamsCount, matchesCount] = await Promise.all([
    prisma.category.count(),
    prisma.team.count(),
    prisma.match.count()
  ])

  const stats = [
    { name: 'Total Categorías', value: categoriesCount, icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Total Equipos', value: teamsCount, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Total Partidos', value: matchesCount, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
        <p className="text-zinc-400">Resumen general de tu plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-sm">
            <dt>
              <div className={`absolute rounded-md p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-zinc-400">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1">
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>
    </div>
  )
}
