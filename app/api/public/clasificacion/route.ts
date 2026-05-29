import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const categoryId = searchParams.get('categoryId')

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  }

  try {
    const standings = await prisma.standing.findMany({
      where: { categoryId },
      include: {
        team: true
      },
      orderBy: [
        { points: 'desc' },
        { goalsFor: 'desc' }
      ]
    })
    return NextResponse.json(standings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
  }
}
