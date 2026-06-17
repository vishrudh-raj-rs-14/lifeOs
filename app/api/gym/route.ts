import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, startOfMonth, endOfMonth, format } from "date-fns";

// Gym attendance is derived entirely from workout logs — no manual toggling.
export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");

    const workouts = monthStr
      ? await db.workout.findMany({
          where: {
            date: {
              gte: startOfMonth(parseISO(monthStr + "-01")),
              lte: endOfMonth(parseISO(monthStr + "-01")),
            },
          },
          select: { id: true, date: true },
          orderBy: { date: "asc" },
        })
      : await db.workout.findMany({
          select: { id: true, date: true },
          orderBy: { date: "desc" },
          take: 90,
        });

    // Deduplicate by date — one entry per day worked out
    const seen = new Set<string>();
    const entries = workouts
      .map((w) => ({ id: w.id, date: format(w.date, "yyyy-MM-dd"), didGo: true }))
      .filter((e) => {
        if (seen.has(e.date)) return false;
        seen.add(e.date);
        return true;
      });

    return NextResponse.json({ entries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
