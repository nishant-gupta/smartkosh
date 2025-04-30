-- Create FinancialSummary table
CREATE TABLE "FinancialSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialSummary_pkey" PRIMARY KEY ("id")
);

-- Create index for faster lookups
CREATE INDEX "FinancialSummary_userId_year_month_idx" ON "FinancialSummary"("userId", "year", "month");
CREATE INDEX "FinancialSummary_userId_category_type_idx" ON "FinancialSummary"("userId", "category", "type");

-- Add foreign key constraint
ALTER TABLE "FinancialSummary" ADD CONSTRAINT "FinancialSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create function to update financial summary
CREATE OR REPLACE FUNCTION update_financial_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing summary for the transaction's month
    DELETE FROM "FinancialSummary"
    WHERE "userId" = NEW."userId"
    AND "year" = EXTRACT(YEAR FROM NEW."date")
    AND "month" = EXTRACT(MONTH FROM NEW."date");

    -- Insert new summary for the month
    INSERT INTO "FinancialSummary" ("id", "userId", "year", "month", "category", "type", "amount", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        "userId",
        EXTRACT(YEAR FROM "date")::integer,
        EXTRACT(MONTH FROM "date")::integer,
        "category",
        "type",
        SUM("amount"),
        CURRENT_TIMESTAMP
    FROM "Transaction"
    WHERE "userId" = NEW."userId"
    AND EXTRACT(YEAR FROM "date") = EXTRACT(YEAR FROM NEW."date")
    AND EXTRACT(MONTH FROM "date") = EXTRACT(MONTH FROM NEW."date")
    GROUP BY "userId", EXTRACT(YEAR FROM "date"), EXTRACT(MONTH FROM "date"), "category", "type";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction changes
CREATE TRIGGER update_financial_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON "Transaction"
FOR EACH ROW
EXECUTE FUNCTION update_financial_summary();

-- Initial data population
INSERT INTO "FinancialSummary" ("id", "userId", "year", "month", "category", "type", "amount", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "userId",
    EXTRACT(YEAR FROM "date")::integer,
    EXTRACT(MONTH FROM "date")::integer,
    "category",
    "type",
    SUM("amount"),
    CURRENT_TIMESTAMP
FROM "Transaction"
GROUP BY "userId", EXTRACT(YEAR FROM "date"), EXTRACT(MONTH FROM "date"), "category", "type"; 