-- CreateTable
CREATE TABLE "DailyHabit" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "habit" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyHabit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyHabit_date_habit_key" ON "DailyHabit"("date", "habit");
