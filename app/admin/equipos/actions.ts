"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Status } from "@prisma/client"

const TeamSchema = z.object({
  categoryId: z.string().uuid("Selecciona una categoría válida"),
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
    return { error: validatedFields.error.errors[0].message }
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
    return { error: validatedFields.error.errors[0].message }
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
