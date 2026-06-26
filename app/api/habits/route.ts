import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const history = searchParams.get("history") === "true";

    const todayHabits = await db.dailyHabit.findMany({
      where: { date: parseISO(date) },
    });

    if (!history) {
      return NextResponse.json({ habits: todayHabits });
    }

    // Return 90 days of history for heatmaps
    const allHabits = await db.dailyHabit.findMany({
      where: { date: { gte: subDays(new Date(), 90) } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ habits: todayHabits, history: allHabits });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { date, habit, value, notes } = await request.json();
    const entry = await db.dailyHabit.upsert({
      where: { date_habit: { date: parseISO(date), habit } },
      update: { value, notes: notes ?? null },
      create: { date: parseISO(date), habit, value, notes: notes ?? null },
    });
    return NextResponse.json(entry);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { date, habit } = await request.json();
    await db.dailyHabit.deleteMany({
      where: { date: parseISO(date), habit },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
