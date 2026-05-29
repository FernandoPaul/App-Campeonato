import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Status } from '@prisma/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const categoryId = searchParams.get('categoryId')

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  }

  try {
    const matches = await prisma.match.findMany({
      where: { 
        categoryId,
        status: Status.PUBLISHED 
      },
      include: {
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { matchDate: 'desc' }
    })
    return NextResponse.json(matches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
