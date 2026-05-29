import { prisma } from "@/lib/prisma"
import TeamForm from "@/components/admin/TeamForm"
import { notFound } from "next/navigation"

export default async function EditarEquipoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params;
  const [team, categories] = await Promise.all([
    prisma.team.findUnique({ where: { id: p.id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } })
  ])

  if (!team) {
    notFound()
  }

  return <TeamForm categories={categories} initialData={team} />
}
