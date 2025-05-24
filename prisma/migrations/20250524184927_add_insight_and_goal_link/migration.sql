/*
  Warnings:

  - A unique constraint covering the columns `[linkedInsightId]` on the table `FinancialGoal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('goal_suggestion', 'goal_progress', 'spending_alert', 'general_advice');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('new', 'action_taken', 'dismissed', 'archived');

-- AlterTable
ALTER TABLE "FinancialGoal" ADD COLUMN     "linkedInsightId" TEXT;

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'new',
    "suggestedAction" TEXT,
    "sourceModel" TEXT,
    "confidenceScore" DOUBLE PRECISION,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialGoal_linkedInsightId_key" ON "FinancialGoal"("linkedInsightId");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_linkedInsightId_fkey" FOREIGN KEY ("linkedInsightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
