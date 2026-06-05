/*
  Warnings:

  - You are about to drop the `MatchEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MatchEvent" DROP CONSTRAINT "MatchEvent_matchId_fkey";

-- DropForeignKey
ALTER TABLE "MatchEvent" DROP CONSTRAINT "MatchEvent_playerId_fkey";

-- DropForeignKey
ALTER TABLE "MatchEvent" DROP CONSTRAINT "MatchEvent_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_teamId_fkey";

-- DropTable
DROP TABLE "MatchEvent";

-- DropTable
DROP TABLE "Player";

-- DropEnum
DROP TYPE "EventType";
