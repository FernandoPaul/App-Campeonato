import { prisma } from "@/lib/prisma"
import MatchForm from "@/components/admin/MatchForm"
import { notFound } from "next/navigation"

export default async function EditarPartidoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params;
  const [match, categories, teams] = await Promise.all([
    prisma.match.findUnique({ where: { id: p.id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.team.findMany({ orderBy: { name: 'asc' } })
  ])

  if (!match) {
    notFound()
  }

  return <MatchForm categories={categories} teams={teams} initialData={match} />
}
