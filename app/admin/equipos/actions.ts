"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Status } from "@prisma/client"
import * as XLSX from "xlsx"

const TeamSchema = z.object({
  categoryId: z.string().uuid("Selecciona una competición válida"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  city: z.string().optional().or(z.literal("")),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  status: z.nativeEnum(Status).default(Status.DRAFT),
})

export async function createTeam(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const data = Object.fromEntries(formData.entries())
  const validatedFields = TeamSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: (validatedFields.error as any).errors[0].message }
  }

  try {
    await prisma.team.create({
      data: {
        ...validatedFields.data,
        city: validatedFields.data.city || null,
        logoUrl: validatedFields.data.logoUrl || null,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "El slug ya está en uso" }
    }
    return { error: "Error al crear el equipo" }
  }

  revalidatePath("/admin/equipos")
  revalidatePath("/")
  redirect("/admin/equipos")
}

export async function updateTeam(id: string, prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const data = Object.fromEntries(formData.entries())
  const validatedFields = TeamSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: (validatedFields.error as any).errors[0].message }
  }

  try {
    await prisma.team.update({
      where: { id },
      data: {
        ...validatedFields.data,
        city: validatedFields.data.city || null,
        logoUrl: validatedFields.data.logoUrl || null,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "El slug ya está en uso" }
    }
    return { error: "Error al actualizar el equipo" }
  }

  revalidatePath("/admin/equipos")
  revalidatePath("/")
  redirect("/admin/equipos")
}

export async function toggleTeamStatus(id: string, currentStatus: Status) {
  const session = await auth()
  if (!session) throw new Error("No autorizado")

  const newStatus = currentStatus === Status.PUBLISHED ? Status.DRAFT : Status.PUBLISHED

  await prisma.team.update({
    where: { id },
    data: { status: newStatus }
  })

  revalidatePath("/admin/equipos")
  revalidatePath("/")
}

export async function deleteTeam(id: string) {
  const session = await auth()
  if (!session) throw new Error("No autorizado")

  try {
    await prisma.team.delete({
      where: { id }
    })
    revalidatePath("/admin/equipos")
    revalidatePath("/")
  } catch (error) {
    throw new Error("No se puede eliminar el equipo porque tiene partidos asociados")
  }
}

export async function uploadTeamsFromExcel(prevState: any, formData: FormData) {
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

    // raw: false convierte todo a strings legibles
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false })

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      // Leer columnas (acepta nombres con/sin tilde, mayúsculas/minúsculas)
      const catName = row["Categoria"] || row["Categoría"] || row["categoria"]
      const teamName = row["Nombre"] || row["nombre"] || row["Name"]
      const slugRaw = row["Slug"] || row["slug"]
      const city = row["Ciudad"] || row["ciudad"] || ""
      const logoUrl = row["Logo URL"] || row["Logo"] || row["logo_url"] || ""
      const statusRaw = row["Estado"] || row["estado"] || row["Status"] || "PUBLISHED"

      // Validación de campos obligatorios
      if (!catName || !teamName || !slugRaw) {
        errorCount++
        errors.push(`Fila ${i + 2}: Faltan campos obligatorios (Competición, Nombre o Slug).`)
        continue
      }

      // Slug: forzar minúsculas y limpiar espacios
      const slug = String(slugRaw).trim().toLowerCase()

      if (!/^[a-z0-9-]+$/.test(slug)) {
        errorCount++
        errors.push(`Fila ${i + 2}: El slug '${slug}' contiene caracteres no válidos (solo minúsculas, números y guiones).`)
        continue
      }

      // Buscar competición (insensible a mayúsculas)
      const category = await prisma.category.findFirst({
        where: { name: { equals: String(catName).trim(), mode: "insensitive" } },
      })

      if (!category) {
        errorCount++
        errors.push(`Fila ${i + 2}: Competición '${catName}' no encontrada en el sistema.`)
        continue
      }

      // Estado
      const status: Status =
        String(statusRaw).trim().toUpperCase() === "DRAFT"
          ? Status.DRAFT
          : Status.PUBLISHED

      // URL del logo — validar solo si viene informada
      const logoUrlClean = String(logoUrl).trim()
      const logoUrlFinal =
        logoUrlClean && logoUrlClean.startsWith("http") ? logoUrlClean : null

      try {
        await prisma.team.create({
          data: {
            categoryId: category.id,
            name: String(teamName).trim(),
            slug,
            city: String(city).trim() || null,
            logoUrl: logoUrlFinal,
            status,
          },
        })
        successCount++
      } catch (createError: any) {
        errorCount++
        if (createError.code === "P2002") {
          errors.push(`Fila ${i + 2}: El slug '${slug}' ya existe. Usa un slug único.`)
        } else {
          errors.push(
            `Fila ${i + 2}: Error al crear '${teamName}' — ${createError.message?.substring(0, 80)}`
          )
        }
      }
    }

    revalidatePath("/admin/equipos")
    revalidatePath("/")

    return {
      success: `Se importaron ${successCount} equipo${successCount !== 1 ? "s" : ""} correctamente.${errorCount > 0 ? ` ${errorCount} fila${errorCount !== 1 ? "s" : ""} con errores.` : ""
        }`,
      errors: errors.slice(0, 10),
    }
  } catch (error: any) {
    console.error("Error procesando Excel de equipos:", error)
    return {
      error: `Error al procesar el archivo: ${error.message?.substring(0, 120) || "Error desconocido"}`,
    }
  }
}