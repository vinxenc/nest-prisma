-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(25) NOT NULL,
    "groupCode" VARCHAR(10) NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_code_key" ON "Stock"("code");
