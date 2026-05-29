import { prisma } from "@/lib/prisma"
import CategoryForm from "@/components/admin/CategoryForm"
import { notFound } from "next/navigation"

export default async function EditarCategoriaPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params;
  const category = await prisma.category.findUnique({
    where: { id: p.id }
  })

  if (!category) {
    notFound()
  }

  return <CategoryForm initialData={category} />
}
