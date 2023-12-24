/*
  Warnings:

  - A unique constraint covering the columns `[stockId,date]` on the table `StockPrice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StockPrice_stockId_date_key" ON "StockPrice"("stockId", "date" DESC);
