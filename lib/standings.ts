import { prisma } from './prisma'
import { MatchStatus, Status } from '@prisma/client'

export async function recalculateStandings(categoryId: string) {
  // 1. Obtener todos los partidos FINISHED y PUBLISHED de la categoría
  const matches = await prisma.match.findMany({
    where: {
      categoryId,
      matchStatus: MatchStatus.FINISHED,
      status: Status.PUBLISHED,
    },
  })

  // 2. Obtener todos los equipos de la categoría para inicializar sus estadísticas
  const teams = await prisma.team.findMany({
    where: { categoryId },
  })

  const statsMap = new Map<string, {
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
  }>()

  // Inicializar mapa
  for (const team of teams) {
    statsMap.set(team.id, {
      played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0
    })
  }

  // 3. Calcular estadísticas
  for (const match of matches) {
    const homeStats = statsMap.get(match.homeTeamId)
    const awayStats = statsMap.get(match.awayTeamId)

    if (!homeStats || !awayStats) continue

    // ── FORFEIT: partido perdido por incomparecencia o sanción ──
    if (match.forfeit && match.forfeitTeamId) {
      const isHomeForfeit = match.forfeitTeamId === match.homeTeamId

      homeStats.played++
      awayStats.played++

      if (isHomeForfeit) {
        // Local pierde — visitante gana 3-0 (convención FIFA)
        awayStats.won++
        awayStats.points += 3
        awayStats.goalsFor += 3
        homeStats.lost++
        homeStats.goalsAgainst += 3
      } else {
        // Visitante pierde — local gana 3-0
        homeStats.won++
        homeStats.points += 3
        homeStats.goalsFor += 3
        awayStats.lost++
        awayStats.goalsAgainst += 3
      }

      continue // no procesar marcador real
    }

    // ── PARTIDO NORMAL ──
    if (match.homeScore === null || match.awayScore === null) continue

    homeStats.played++
    awayStats.played++

    homeStats.goalsFor += match.homeScore
    homeStats.goalsAgainst += match.awayScore

    awayStats.goalsFor += match.awayScore
    awayStats.goalsAgainst += match.homeScore

    if (match.homeScore > match.awayScore) {
      homeStats.won++
      homeStats.points += 3
      awayStats.lost++
    } else if (match.homeScore < match.awayScore) {
      awayStats.won++
      awayStats.points += 3
      homeStats.lost++
    } else {
      homeStats.drawn++
      awayStats.drawn++
      homeStats.points += 1
      awayStats.points += 1
    }
  }

  // 4. Hacer upsert en la tabla Standing usando transacción
  const operations = Array.from(statsMap.entries()).map(([teamId, stats]) => {
    return prisma.standing.upsert({
      where: {
        categoryId_teamId: {
          categoryId,
          teamId,
        }
      },
      update: stats,
      create: {
        categoryId,
        teamId,
        ...stats,
      }
    })
  })

  await prisma.$transaction(operations)
}