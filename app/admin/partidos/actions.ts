"use server"

import { prisma } from "../../../lib/prisma";
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Status, MatchStatus } from "@prisma/client"
import { recalculateStandings } from "@/lib/standings"
import * as XLSX from "xlsx"

const MatchSchema = z.object({
  categoryId: z.string().uuid("Selecciona una categoría válida"),
  homeTeamId: z.string().uuid("Selecciona un equipo local válido"),
  awayTeamId: z.string().uuid("Selecciona un equipo visitante válido"),
  homeScore: z.string().optional().transform(v => v === "" ? null : Number(v)),
  awayScore: z.string().optional().transform(v => v === "" ? null : Number(v)),
  matchDate: z.string().optional().transform(v => v ? new Date(v) : null),
  round: z.string().optional().or(z.literal("")),
  matchStatus: z.nativeEnum(MatchStatus).default(MatchStatus.SCHEDULED),
  status: z.nativeEnum(Status).default(Status.DRAFT),
  // ── Forfeit ──
  forfeit: z.string().optional().transform(v => v === "on" || v === "true"),
  forfeitTeamId: z.string().optional().or(z.literal("")),
  forfeitReason: z.string().optional().or(z.literal("")),
})

export async function createMatch(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const data = Object.fromEntries(formData.entries())

  if (data.homeTeamId === data.awayTeamId) {
    return { error: "Un equipo no puede jugar contra sí mismo" }
  }

  const validatedFields = MatchSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: "Datos inválidos: " + validatedFields.error.errors[0].message }
  }

  const { forfeit, forfeitTeamId, forfeitReason, ...rest } = validatedFields.data

  try {
    const match = await prisma.match.create({
      data: {
        categoryId: rest.categoryId,
        homeTeamId: rest.homeTeamId,
        awayTeamId: rest.awayTeamId,
        homeScore: rest.homeScore,
        awayScore: rest.awayScore,
        matchDate: rest.matchDate,
        round: rest.round || null,
        matchStatus: rest.matchStatus,
        status: rest.status,
        forfeit: forfeit ?? false,
        forfeitTeamId: forfeit && forfeitTeamId ? forfeitTeamId : null,
        forfeitReason: forfeit && forfeitReason ? forfeitReason : null,
      }
    })

    if (match.matchStatus === 'FINISHED' && match.status === 'PUBLISHED') {
      await recalculateStandings(match.categoryId)
    }

  } catch (error: any) {
    return { error: "Error al crear el partido" }
  }

  revalidatePath("/admin/partidos")
  revalidatePath("/")
  redirect("/admin/partidos")
}

export async function updateMatch(id: string, prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const data = Object.fromEntries(formData.entries())

  if (data.homeTeamId === data.awayTeamId) {
    return { error: "Un equipo no puede jugar contra sí mismo" }
  }

  const validatedFields = MatchSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: "Datos inválidos: " + validatedFields.error.errors[0].message }
  }

  const { forfeit, forfeitTeamId, forfeitReason, ...rest } = validatedFields.data

  try {
    const match = await prisma.match.update({
      where: { id },
      data: {
        categoryId: rest.categoryId,
        homeTeamId: rest.homeTeamId,
        awayTeamId: rest.awayTeamId,
        homeScore: rest.homeScore,
        awayScore: rest.awayScore,
        matchDate: rest.matchDate,
        round: rest.round || null,
        matchStatus: rest.matchStatus,
        status: rest.status,
        forfeit: forfeit ?? false,
        forfeitTeamId: forfeit && forfeitTeamId ? forfeitTeamId : null,
        forfeitReason: forfeit && forfeitReason ? forfeitReason : null,
      }
    })

    await recalculateStandings(match.categoryId)

  } catch (error: any) {
    return { error: "Error al actualizar el partido" }
  }

  revalidatePath("/admin/partidos")
  revalidatePath("/")
  redirect("/admin/partidos")
}

export async function deleteMatch(id: string) {
  const session = await auth()
  if (!session) throw new Error("No autorizado")

  try {
    const match = await prisma.match.delete({ where: { id } })
    await recalculateStandings(match.categoryId)
    revalidatePath("/admin/partidos")
    revalidatePath("/")
  } catch (error) {
    throw new Error("No se pudo eliminar el partido")
  }
}

export async function uploadMatchesFromExcel(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const file = formData.get("file") as File
  if (!file) return { error: "No se proporcionó ningún archivo" }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const workbook = XLSX.read(buffer, { type: "buffer" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    const data = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false })

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const catName = row["Categoria"] || row["Categoría"] || row["categoria"]
      const homeName = row["Equipo Local"] || row["Local"] || row["home"]
      const awayName = row["Equipo Visitante"] || row["Visitante"] || row["away"]
      const dateStr = row["Fecha"] || row["fecha"]
      const timeStr = row["Hora"] || row["hora"]
      const roundStr = row["Jornada"] || row["jornada"] || row["Fase"] || row["fase"]

      if (!catName || !homeName || !awayName) {
        errorCount++
        errors.push(`Fila ${i + 2}: Faltan datos requeridos (Categoría o Equipos).`)
        continue
      }

      const category = await prisma.category.findFirst({
        where: { name: { equals: catName, mode: 'insensitive' } }
      })

      if (!category) {
        errorCount++
        errors.push(`Fila ${i + 2}: Categoría '${catName}' no encontrada.`)
        continue
      }

      const homeTeam = await prisma.team.findFirst({
        where: { categoryId: category.id, name: { equals: homeName, mode: 'insensitive' } }
      })

      const awayTeam = await prisma.team.findFirst({
        where: { categoryId: category.id, name: { equals: awayName, mode: 'insensitive' } }
      })

      if (!homeTeam || !awayTeam) {
        errorCount++
        errors.push(`Fila ${i + 2}: Equipo Local o Visitante no encontrado en la categoría.`)
        continue
      }

      let matchDate: Date | null = null
      if (dateStr) {
        const ddmmyyyy = String(dateStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy
          const timepart = timeStr ? `T${String(timeStr).trim()}:00` : 'T00:00:00'
          const parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timepart}`)
          if (!isNaN(parsedDate.getTime())) {
            matchDate = parsedDate
          }
        } else {
          const dateTimeString = timeStr ? `${dateStr} ${timeStr}` : dateStr
          const parsedDate = new Date(dateTimeString)
          if (!isNaN(parsedDate.getTime())) {
            matchDate = parsedDate
          }
        }
      }

      const statusStr = row["Estado"] || row["Status"] || row["matchStatus"];
      const matchStatus: typeof MatchStatus[keyof typeof MatchStatus] =
        statusStr && Object.values(MatchStatus).includes(statusStr as any)
          ? (statusStr as any)
          : MatchStatus.SCHEDULED;

      const homeScoreRaw = row["Goles Local"] ?? row["Goles Home"];
      const awayScoreRaw = row["Goles Visitante"] ?? row["Goles Away"];
      const homeScore = homeScoreRaw !== undefined && homeScoreRaw !== "" ? Number(homeScoreRaw) : null;
      const awayScore = awayScoreRaw !== undefined && awayScoreRaw !== "" ? Number(awayScoreRaw) : null;

      try {
        await prisma.match.create({
          data: {
            categoryId: category.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            matchDate: matchDate,
            round: roundStr ? String(roundStr) : null,
            matchStatus: matchStatus,
            status: Status.PUBLISHED,
            homeScore: homeScore,
            awayScore: awayScore,
          }
        })
        successCount++;
        if (matchStatus === MatchStatus.FINISHED) {
          await recalculateStandings(category.id);
        }
      } catch (createError: any) {
        errorCount++;
        errors.push(`Fila ${i + 2}: Error al crear partido - ${createError.message?.substring(0, 80)}`);
      }
    }

    revalidatePath("/admin/partidos")
    revalidatePath("/")

    return {
      success: `Se importaron ${successCount} partidos correctamente. ${errorCount > 0 ? `Hubo ${errorCount} errores.` : ''}`,
      errors: errors.slice(0, 10)
    }

  } catch (error: any) {
    console.error("Error procesando Excel:", error)
    return { error: `Error al procesar el archivo: ${error.message?.substring(0, 120) || 'Error desconocido'}` }
  }
}