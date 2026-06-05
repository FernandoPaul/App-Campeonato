"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { EventType } from "@prisma/client"
import { z } from "zod"

const EventSchema = z.object({
    matchId: z.string().uuid(),
    playerId: z.string().uuid("Selecciona un jugador válido"),
    teamId: z.string().uuid(),
    type: z.nativeEnum(EventType),
})

export async function addMatchEvent(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session) return { error: "No autorizado" }

    const data = Object.fromEntries(formData.entries())
    const validated = EventSchema.safeParse(data)
    if (!validated.success) return { error: validated.error.errors[0].message }

    // Verificar que el jugador pertenece al equipo
    const player = await prisma.player.findFirst({
        where: { id: validated.data.playerId, teamId: validated.data.teamId },
    })
    if (!player) return { error: "El jugador no pertenece al equipo seleccionado" }

    // Verificar que el equipo juega ese partido
    const match = await prisma.match.findFirst({
        where: {
            id: validated.data.matchId,
            OR: [
                { homeTeamId: validated.data.teamId },
                { awayTeamId: validated.data.teamId },
            ],
        },
    })
    if (!match) return { error: "El equipo no participa en este partido" }

    await prisma.matchEvent.create({ data: validated.data })

    revalidatePath(`/admin/partidos/${validated.data.matchId}/vocalia`)
    revalidatePath("/admin/partidos")
    revalidatePath("/")

    return { success: "Evento registrado correctamente" }
}

export async function deleteMatchEvent(id: string, matchId: string) {
    const session = await auth()
    if (!session) throw new Error("No autorizado")

    await prisma.matchEvent.delete({ where: { id } })

    revalidatePath(`/admin/partidos/${matchId}/vocalia`)
    revalidatePath("/admin/partidos")
    revalidatePath("/")
}