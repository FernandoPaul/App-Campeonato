"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Status } from "@prisma/client"

const CompetitionSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  sport: z.string().min(2, "El deporte debe tener al menos 2 caracteres"),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  status: z.nativeEnum(Status).default(Status.DRAFT),
})

export async function createCategory(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const data = Object.fromEntries(formData.entries())
  const validatedFields = CompetitionSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: (validatedFields.error as any).errors[0].message }
  }

  try {
    await prisma.category.create({
      data: {
        ...validatedFields.data,
        logoUrl: validatedFields.data.logoUrl || null,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "El slug ya está en uso" }
    }
    return { error: "Error al crear la competición" }
  }

  revalidatePath("/admin/competiciones")
  revalidatePath("/")
  redirect("/admin/competiciones")
}

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const data = Object.fromEntries(formData.entries())
  const validatedFields = CompetitionSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: (validatedFields.error as any).errors[0].message }
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        ...validatedFields.data,
        logoUrl: validatedFields.data.logoUrl || null,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "El slug ya está en uso" }
    }
    return { error: "Error al actualizar la competición" }
  }

  revalidatePath("/admin/competiciones")
  revalidatePath(`/${validatedFields.data.slug}`)
  revalidatePath("/")
  redirect("/admin/competiciones")
}

export async function toggleCategoryStatus(id: string, currentStatus: Status) {
  const session = await auth()
  if (!session) throw new Error("No autorizado")

  const newStatus = currentStatus === Status.PUBLISHED ? Status.DRAFT : Status.PUBLISHED

  await prisma.category.update({
    where: { id },
    data: { status: newStatus }
  })

  revalidatePath("/admin/competiciones")
  revalidatePath("/")
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session) throw new Error("No autorizado")

  try {
    await prisma.category.delete({
      where: { id }
    })
    revalidatePath("/admin/competiciones")
    revalidatePath("/")
  } catch (error) {
    throw new Error("No se puede eliminar la competición porque tiene equipos o partidos asociados")
  }
}
