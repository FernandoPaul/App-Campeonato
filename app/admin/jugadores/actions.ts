"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Status } from "@prisma/client"
import * as XLSX from "xlsx"

const PlayerSchema = z.object({
    teamId: z.string().uuid("Selecciona un equipo válido"),
    categoryId: z.string().uuid("Categoría inválida"),
    firstName: z.string().min(1, "El nombre es obligatorio").max(60),
    lastName: z.string().min(1, "El apellido es obligatorio").max(60),
    dorsal: z.string().regex(/^\d+$/, "El dorsal debe ser un número").transform(Number)
        .refine(n => n >= 1 && n <= 99, "El dorsal debe estar entre 1 y 99"),
    status: z.nativeEnum(Status).default(Status.PUBLISHED),
})

export async function createPlayer(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session) return { error: "No autorizado" }

    const data = Object.fromEntries(formData.entries())
    const validated = PlayerSchema.safeParse(data)
    if (!validated.success) return { error: validated.error.errors[0].message }

    try {
        await prisma.player.create({ data: validated.data })
    } catch (e: any) {
        if (e.code === "P2002") return { error: "Ya existe un jugador con ese dorsal en este equipo" }
        return { error: "Error al crear el jugador" }
    }

    revalidatePath("/admin/jugadores")
    revalidatePath("/")
    redirect("/admin/jugadores")
}

export async function updatePlayer(id: string, prevState: any, formData: FormData) {
    const session = await auth()
    if (!session) return { error: "No autorizado" }

    const data = Object.fromEntries(formData.entries())
    const validated = PlayerSchema.safeParse(data)
    if (!validated.success) return { error: validated.error.errors[0].message }

    try {
        await prisma.player.update({ where: { id }, data: validated.data })
    } catch (e: any) {
        if (e.code === "P2002") return { error: "Ya existe un jugador con ese dorsal en este equipo" }
        return { error: "Error al actualizar el jugador" }
    }

    revalidatePath("/admin/jugadores")
    revalidatePath("/")
    redirect("/admin/jugadores")
}

export async function deletePlayer(id: string) {
    const session = await auth()
    if (!session) throw new Error("No autorizado")

    try {
        await prisma.player.delete({ where: { id } })
        revalidatePath("/admin/jugadores")
        revalidatePath("/")
    } catch {
        throw new Error("No se puede eliminar el jugador porque tiene eventos registrados")
    }
}

export async function uploadPlayersFromExcel(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session) return { error: "No autorizado" }

    const file = formData.get("file") as File
    if (!file) return { error: "No se proporcionó ningún archivo" }

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const workbook = XLSX.read(buffer, { type: "buffer" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false })

        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (let i = 0; i < data.length; i++) {
            const row = data[i]
            const fila = i + 2

            const catName = row["Categoria"] || row["Categoría"] || row["categoria"]
            const teamName = row["Equipo"] || row["equipo"]
            const firstName = row["Nombre"] || row["nombre"]
            const lastName = row["Apellido"] || row["apellido"]
            const dorsalRaw = row["Dorsal"] || row["dorsal"]

            if (!catName || !teamName || !firstName || !lastName || !dorsalRaw) {
                errorCount++
                errors.push(`Fila ${fila}: Faltan campos obligatorios (Categoria, Equipo, Nombre, Apellido, Dorsal).`)
                continue
            }

            const dorsal = Number(dorsalRaw)
            if (isNaN(dorsal) || dorsal < 1 || dorsal > 99) {
                errorCount++
                errors.push(`Fila ${fila}: Dorsal '${dorsalRaw}' inválido (debe ser entre 1 y 99).`)
                continue
            }

            const category = await prisma.category.findFirst({
                where: { name: { equals: String(catName).trim(), mode: "insensitive" } },
            })
            if (!category) {
                errorCount++
                errors.push(`Fila ${fila}: Categoría '${catName}' no encontrada.`)
                continue
            }

            const team = await prisma.team.findFirst({
                where: { categoryId: category.id, name: { equals: String(teamName).trim(), mode: "insensitive" } },
            })
            if (!team) {
                errorCount++
                errors.push(`Fila ${fila}: Equipo '${teamName}' no encontrado en la categoría '${catName}'.`)
                continue
            }

            try {
                await prisma.player.create({
                    data: {
                        teamId: team.id,
                        categoryId: category.id,
                        firstName: String(firstName).trim(),
                        lastName: String(lastName).trim(),
                        dorsal,
                        status: Status.PUBLISHED,
                    },
                })
                successCount++
            } catch (e: any) {
                errorCount++
                if (e.code === "P2002") {
                    errors.push(`Fila ${fila}: El dorsal ${dorsal} ya existe en el equipo '${teamName}'.`)
                } else {
                    errors.push(`Fila ${fila}: Error al crear '${firstName} ${lastName}' — ${e.message?.substring(0, 80)}`)
                }
            }
        }

        revalidatePath("/admin/jugadores")
        revalidatePath("/")

        return {
            success: `Se importaron ${successCount} jugador${successCount !== 1 ? "es" : ""} correctamente.${errorCount > 0 ? ` ${errorCount} fila${errorCount !== 1 ? "s" : ""} con errores.` : ""}`,
            errors: errors.slice(0, 10),
        }
    } catch (e: any) {
        return { error: `Error al procesar el archivo: ${e.message?.substring(0, 120) || "Error desconocido"}` }
    }
}