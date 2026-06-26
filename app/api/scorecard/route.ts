import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, format, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const date = parseISO(dateStr);
    const tomorrow = addDays(date, 1);

    const [
      weightEntry,
      workout,
      stepsEntry,
      screenTimeEntry,
      deepWorkEntry,
      todayHabits,
      tomorrowGoals,
    ] = await Promise.all([
      db.dailyWeight.findUnique({ where: { date } }),
      db.workout.findFirst({ where: { date } }),
      db.steps.findUnique({ where: { date } }),
      db.screenTime.findUnique({ where: { date } }),
      db.deepWork.findUnique({ where: { date } }),
      db.dailyHabit.findMany({ where: { date } }),
      db.dailyGoal.findMany({ where: { date: tomorrow } }),
    ]);

    const habitMap = Object.fromEntries(todayHabits.map((h) => [h.habit, h.value]));

    return NextResponse.json({
      date: dateStr,
      weight: {
        logged: !!weightEntry,
        value: weightEntry?.weightKg ?? null,
      },
      workout: {
        logged: !!workout,
        type: workout?.type ?? null,
      },
      steps: {
        logged: !!stepsEntry,
        count: stepsEntry?.count ?? null,
        hit10k: (stepsEntry?.count ?? 0) >= 10000,
      },
      screenTime: {
        logged: !!screenTimeEntry,
        youtubeMinutes: screenTimeEntry?.youtubeMinutes ?? null,
        socialMinutes: screenTimeEntry?.socialMediaMinutes ?? null,
        noSocial: !!screenTimeEntry && (screenTimeEntry.youtubeMinutes + screenTimeEntry.socialMediaMinutes) <= 30,
      },
      deepWork: {
        logged: !!deepWorkEntry,
        minutes: deepWorkEntry?.minutes ?? null,
        hit4h: (deepWorkEntry?.minutes ?? 0) >= 240,
      },
      sleep: {
        logged: "sleep" in habitMap,
        hours: habitMap["sleep"] ?? null,
        hit7h: (habitMap["sleep"] ?? 0) >= 7,
      },
      project: {
        logged: "project" in habitMap,
        minutes: habitMap["project"] ?? null,
      },
      wholefoods: {
        logged: "whole_foods" in habitMap,
        percent: habitMap["whole_foods"] ?? null,
        hit90: (habitMap["whole_foods"] ?? 0) >= 90,
      },
      techReading: {
        logged: "tech_reading" in habitMap,
      },
      nonfiction: {
        logged: "nonfiction" in habitMap,
      },
      plannedTomorrow: {
        done: tomorrowGoals.length > 0,
        count: tomorrowGoals.length,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
