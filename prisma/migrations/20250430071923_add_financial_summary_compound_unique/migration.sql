/*
  Warnings:

  - A unique constraint covering the columns `[userId,year,month,category,type]` on the table `FinancialSummary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FinancialSummary_userId_year_month_category_type_key" ON "FinancialSummary"("userId", "year", "month", "category", "type");
