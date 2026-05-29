import { prisma } from "@/lib/prisma"
import MatchForm from "@/components/admin/MatchForm"

export default async function NuevoPartidoPage() {
  const [categories, teams] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.team.findMany({ orderBy: { name: 'asc' } })
  ])

  return <MatchForm categories={categories} teams={teams} />
}
