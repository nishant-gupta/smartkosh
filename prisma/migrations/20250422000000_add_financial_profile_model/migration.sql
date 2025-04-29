-- CreateTable
CREATE TABLE "FinancialProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "yearlyIncome" TEXT,
  "occupation" TEXT,
  "incomeSource" TEXT,
  "taxBracket" TEXT,
  "savingsGoal" TEXT,
  "financialGoals" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FinancialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialProfile_userId_key" ON "FinancialProfile"("userId");

-- AddForeignKey
ALTER TABLE "FinancialProfile" ADD CONSTRAINT "FinancialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 