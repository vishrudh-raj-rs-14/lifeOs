import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, startOfWeek, endOfWeek, format } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const weekStr = searchParams.get("week");

    if (weekStr) {
      const weekStart = startOfWeek(parseISO(weekStr), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const [review, gymDays, cfProblems, deepWorkDays] = await Promise.all([
        db.weeklyReview.findUnique({ where: { weekStart } }),
        db.gymDay.findMany({ where: { date: { gte: weekStart, lte: weekEnd }, didGo: true } }),
        db.cfProblem.findMany({ where: { date: { gte: weekStart, lte: weekEnd } } }),
        db.deepWork.findMany({ where: { date: { gte: weekStart, lte: weekEnd } } }),
      ]);

      const weekStats = {
        gymDays: gymDays.length,
        cfProblems: cfProblems.length,
        deepWorkMinutes: deepWorkDays.reduce((s, d) => s + d.minutes, 0),
        weekLabel: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`,
      };

      return NextResponse.json({ review, weekStats });
    }

    const reviews = await db.weeklyReview.findMany({ orderBy: { weekStart: "desc" } });
    return NextResponse.json({ reviews });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { weekStart: weekStartStr, wins, struggles, learnings, nextWeekFocus, weeklyLearning } = await request.json();
    const weekStart = startOfWeek(parseISO(weekStartStr), { weekStartsOn: 1 });

    const review = await db.weeklyReview.upsert({
      where: { weekStart },
      update: { wins, struggles, learnings, nextWeekFocus, weeklyLearning },
      create: { weekStart, wins, struggles, learnings, nextWeekFocus, weeklyLearning },
    });
    return NextResponse.json(review);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
