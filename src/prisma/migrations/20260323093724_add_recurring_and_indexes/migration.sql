-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "merchant" TEXT,
    "total" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL DEFAULT 'expense',
    "categoryCode" TEXT,
    "projectCode" TEXT,
    "frequency" TEXT NOT NULL,
    "nextDueDate" DATETIME NOT NULL,
    "lastGenerated" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_idx" ON "RecurringTransaction"("userId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_active_nextDueDate_idx" ON "RecurringTransaction"("userId", "active", "nextDueDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_issuedAt_idx" ON "Transaction"("userId", "issuedAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryCode_issuedAt_idx" ON "Transaction"("userId", "categoryCode", "issuedAt");

-- CreateIndex
CREATE INDEX "Transaction_merchant_idx" ON "Transaction"("merchant");
