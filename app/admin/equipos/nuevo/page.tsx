import { prisma } from "@/lib/prisma"
import TeamForm from "@/components/admin/TeamForm"

export default async function NuevoEquipoPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  return <TeamForm categories={categories} />
}
