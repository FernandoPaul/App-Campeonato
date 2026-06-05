import { prisma } from "@/lib/prisma"
import PlayerForm from "@/components/admin/PlayerForm"
import { notFound } from "next/navigation"

export default async function EditarJugadorPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const [player, categories, teams] = await Promise.all([
        prisma.player.findUnique({ where: { id } }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.team.findMany({ orderBy: { name: "asc" } }),
    ])

    if (!player) notFound()

    return <PlayerForm categories={categories} teams={teams} initialData={player} />
}