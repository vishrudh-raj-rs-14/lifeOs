import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

    const goals = await db.dailyGoal.findMany({
      where: { date: parseISO(date) },
      orderBy: { position: "asc" },
    });

    // Get last 30 days for heatmap
    const heatmapData = await db.dailyGoal.findMany({
      where: {
        date: { gte: subDays(new Date(), 30) },
      },
      orderBy: { date: "asc" },
    });

    // Group by date
    const heatmap: Record<string, { total: number; completed: number }> = {};
    for (const g of heatmapData) {
      const key = format(g.date, "yyyy-MM-dd");
      if (!heatmap[key]) heatmap[key] = { total: 0, completed: 0 };
      heatmap[key].total++;
      if (g.completed) heatmap[key].completed++;
    }

    // Get streak
    let streak = await db.goalStreak.findFirst();
    if (!streak) {
      streak = await db.goalStreak.create({ data: {} });
    }

    return NextResponse.json({ goals, heatmap, streak });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { date, goals } = await request.json();
    // goals = [{ text, position }]
    const parsedDate = parseISO(date);

    // Delete existing for that date
    await db.dailyGoal.deleteMany({ where: { date: parsedDate } });

    // Create new
    const created = await db.dailyGoal.createMany({
      data: goals.map((g: { text: string; position: number }) => ({
        date: parsedDate,
        text: g.text,
        position: g.position,
        completed: false,
      })),
    });

    return NextResponse.json({ ok: true, count: created.count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, completed, date } = await request.json();

    await db.dailyGoal.update({
      where: { id },
      data: { completed },
    });

    // Recalculate streak
    if (completed && date) {
      const parsedDate = parseISO(date);
      const allGoals = await db.dailyGoal.findMany({
        where: { date: parsedDate },
      });

      const allDone = allGoals.length > 0 && allGoals.every((g) => g.id === id ? completed : g.completed);

      if (allDone) {
        let streak = await db.goalStreak.findFirst();
        if (!streak) streak = await db.goalStreak.create({ data: {} });

        const yesterday = subDays(parsedDate, 1);
        const lastDate = streak.lastCompletedDate;
        let newStreak = 1;

        if (lastDate && format(lastDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
          newStreak = streak.currentStreak + 1;
        }

        await db.goalStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastCompletedDate: parsedDate,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
