import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { startOfWeek, endOfWeek, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const entries = await db.dailyWeight.findMany({
      orderBy: { date: "desc" },
      take: 90,
    });

    // Weekly averages
    const weekly: Record<string, { total: number; count: number; start: Date }> = {};
    for (const e of entries) {
      const mon = startOfWeek(e.date, { weekStartsOn: 1 });
      const key = mon.toISOString().split("T")[0];
      if (!weekly[key]) weekly[key] = { total: 0, count: 0, start: mon };
      weekly[key].total += e.weightKg;
      weekly[key].count++;
    }

    const weeklyAverages = Object.entries(weekly)
      .map(([key, { total, count, start }]) => ({
        weekStart: key,
        avg: Math.round((total / count) * 10) / 10,
        count,
        end: endOfWeek(start, { weekStartsOn: 1 }).toISOString().split("T")[0],
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    return NextResponse.json({ entries, weeklyAverages });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { date, weightKg } = await request.json();
    const entry = await db.dailyWeight.upsert({
      where: { date: parseISO(date) },
      update: { weightKg },
      create: { date: parseISO(date), weightKg },
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
    const { id } = await request.json();
    await db.dailyWeight.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
