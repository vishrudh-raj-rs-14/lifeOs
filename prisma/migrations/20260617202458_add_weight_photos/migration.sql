-- CreateTable
CREATE TABLE "WeightPhoto" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeightPhoto_filename_key" ON "WeightPhoto"("filename");
