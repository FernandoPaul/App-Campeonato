import { prisma } from "@/lib/prisma"
import PlayerForm from "@/components/admin/PlayerForm"

export default async function NuevoJugadorPage() {
    const [categories, teams] = await Promise.all([
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.team.findMany({ orderBy: { name: "asc" } }),
    ])

    return <PlayerForm categories={categories} teams={teams} />
}