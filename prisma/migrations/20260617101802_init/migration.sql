-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('PUSH', 'PULL', 'LEGS', 'CARDIO', 'UPPER', 'LOWER', 'FULL_BODY', 'OTHER');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('READING', 'COMPLETED', 'PAUSED');

-- CreateTable
CREATE TABLE "DailyWeight" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Steps" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "type" "WorkoutType" NOT NULL,
    "exercises" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymDay" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "didGo" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfProblem" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "contestId" INTEGER NOT NULL,
    "problemIndex" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" INTEGER,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CfProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfRatingSnapshot" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "rating" INTEGER NOT NULL,
    "contestName" TEXT,
    "contestId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CfRatingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyGoal" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalStreak" (
    "id" SERIAL NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDate" DATE,

    CONSTRAINT "GoalStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningLog" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeepWork" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "totalPages" INTEGER,
    "currentPage" INTEGER,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "BookStatus" NOT NULL DEFAULT 'READING',
    "summaryNotes" TEXT,
    "genre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" SERIAL NOT NULL,
    "weekStart" DATE NOT NULL,
    "wins" TEXT,
    "struggles" TEXT,
    "learnings" TEXT,
    "nextWeekFocus" TEXT,
    "weeklyLearning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreenTime" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "youtubeMinutes" INTEGER NOT NULL DEFAULT 0,
    "socialMediaMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreenTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyWeight_date_key" ON "DailyWeight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Steps_date_key" ON "Steps"("date");

-- CreateIndex
CREATE UNIQUE INDEX "GymDay_date_key" ON "GymDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CfRatingSnapshot_date_key" ON "CfRatingSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyGoal_date_position_key" ON "DailyGoal"("date", "position");

-- CreateIndex
CREATE UNIQUE INDEX "LearningLog_date_key" ON "LearningLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DeepWork_date_key" ON "DeepWork"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_weekStart_key" ON "WeeklyReview"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "ScreenTime_date_key" ON "ScreenTime"("date");
