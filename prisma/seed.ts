import { PrismaClient, Status, MatchStatus, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.standing.deleteMany()
  await prisma.match.deleteMany()
  await prisma.team.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // 1. Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sports.com',
      name: 'Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // 2. Crear categorías
  const catPrimera = await prisma.category.create({
    data: {
      name: 'Primera División',
      slug: 'primera-division',
      sport: 'Fútbol',
      status: Status.PUBLISHED,
    },
  })

  const catChampions = await prisma.category.create({
    data: {
      name: 'Champions League',
      slug: 'champions-league',
      sport: 'Fútbol',
      status: Status.PUBLISHED,
    },
  })

  console.log('Created categories')

  // 3. Crear equipos
  const teamsDataPrimera = [
    { name: 'Real Madrid', slug: 'real-madrid', city: 'Madrid', categoryId: catPrimera.id, status: Status.PUBLISHED },
    { name: 'Barcelona', slug: 'barcelona', city: 'Barcelona', categoryId: catPrimera.id, status: Status.PUBLISHED },
    { name: 'Atlético de Madrid', slug: 'atletico-madrid', city: 'Madrid', categoryId: catPrimera.id, status: Status.PUBLISHED },
  ]

  const teamsDataChampions = [
    { name: 'Manchester City', slug: 'man-city', city: 'Manchester', categoryId: catChampions.id, status: Status.PUBLISHED },
    { name: 'Bayern Munich', slug: 'bayern-munich', city: 'Munich', categoryId: catChampions.id, status: Status.PUBLISHED },
    { name: 'PSG', slug: 'psg', city: 'Paris', categoryId: catChampions.id, status: Status.PUBLISHED },
  ]

  const createdTeamsPrimera = await Promise.all(
    teamsDataPrimera.map(data => prisma.team.create({ data }))
  )

  const createdTeamsChampions = await Promise.all(
    teamsDataChampions.map(data => prisma.team.create({ data }))
  )

  console.log('Created teams')

  // 4. Crear partidos
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Partidos Primera
  await prisma.match.create({
    data: {
      categoryId: catPrimera.id,
      homeTeamId: createdTeamsPrimera[0].id,
      awayTeamId: createdTeamsPrimera[1].id,
      homeScore: 2,
      awayScore: 1,
      matchDate: yesterday,
      matchStatus: MatchStatus.FINISHED,
      status: Status.PUBLISHED,
    }
  })

  await prisma.match.create({
    data: {
      categoryId: catPrimera.id,
      homeTeamId: createdTeamsPrimera[1].id,
      awayTeamId: createdTeamsPrimera[2].id,
      matchDate: today,
      matchStatus: MatchStatus.LIVE,
      homeScore: 0,
      awayScore: 0,
      status: Status.PUBLISHED,
    }
  })

  await prisma.match.create({
    data: {
      categoryId: catPrimera.id,
      homeTeamId: createdTeamsPrimera[2].id,
      awayTeamId: createdTeamsPrimera[0].id,
      matchDate: tomorrow,
      matchStatus: MatchStatus.SCHEDULED,
      status: Status.PUBLISHED,
    }
  })

  await prisma.match.create({
    data: {
      categoryId: catPrimera.id,
      homeTeamId: createdTeamsPrimera[0].id,
      awayTeamId: createdTeamsPrimera[2].id,
      matchDate: tomorrow,
      matchStatus: MatchStatus.SCHEDULED,
      status: Status.DRAFT, // Un partido en borrador
    }
  })

  // Partidos Champions
  await prisma.match.create({
    data: {
      categoryId: catChampions.id,
      homeTeamId: createdTeamsChampions[0].id,
      awayTeamId: createdTeamsChampions[1].id,
      homeScore: 3,
      awayScore: 0,
      matchDate: yesterday,
      matchStatus: MatchStatus.FINISHED,
      status: Status.PUBLISHED,
    }
  })

  await prisma.match.create({
    data: {
      categoryId: catChampions.id,
      homeTeamId: createdTeamsChampions[1].id,
      awayTeamId: createdTeamsChampions[2].id,
      matchDate: today,
      matchStatus: MatchStatus.LIVE,
      homeScore: 1,
      awayScore: 2,
      status: Status.PUBLISHED,
    }
  })

  await prisma.match.create({
    data: {
      categoryId: catChampions.id,
      homeTeamId: createdTeamsChampions[2].id,
      awayTeamId: createdTeamsChampions[0].id,
      matchDate: tomorrow,
      matchStatus: MatchStatus.SCHEDULED,
      status: Status.PUBLISHED,
    }
  })

  await prisma.match.create({
    data: {
      categoryId: catChampions.id,
      homeTeamId: createdTeamsChampions[0].id,
      awayTeamId: createdTeamsChampions[2].id,
      matchDate: tomorrow,
      matchStatus: MatchStatus.POSTPONED,
      status: Status.PUBLISHED,
    }
  })

  console.log('Created matches')

  // Calculate Standings manually for the FINISHED matches just for the seed
  // Primera: Team 0 won, Team 1 lost
  await prisma.standing.create({
    data: {
      categoryId: catPrimera.id,
      teamId: createdTeamsPrimera[0].id,
      played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3
    }
  })
  await prisma.standing.create({
    data: {
      categoryId: catPrimera.id,
      teamId: createdTeamsPrimera[1].id,
      played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0
    }
  })

  // Champions: Team 0 won, Team 1 lost
  await prisma.standing.create({
    data: {
      categoryId: catChampions.id,
      teamId: createdTeamsChampions[0].id,
      played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, points: 3
    }
  })
  await prisma.standing.create({
    data: {
      categoryId: catChampions.id,
      teamId: createdTeamsChampions[1].id,
      played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, points: 0
    }
  })

  console.log('Created initial standings')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
