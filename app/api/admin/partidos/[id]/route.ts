import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { MatchStatus } from '@prisma/client'
import { recalculateStandings } from '@/lib/standings'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    // Si cambia de estado y es a FINISHED, necesitamos recalcular
    const updatedMatch = await prisma.match.update({
      where: { id: params.id },
      data
    })

    if (updatedMatch.matchStatus === MatchStatus.FINISHED) {
      await recalculateStandings(updatedMatch.categoryId)
    }

    return NextResponse.json(updatedMatch)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}
