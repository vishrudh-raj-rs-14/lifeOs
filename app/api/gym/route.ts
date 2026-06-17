import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");

    const entries = monthStr
      ? await db.gymDay.findMany({
          where: {
            date: {
              gte: startOfMonth(parseISO(monthStr + "-01")),
              lte: endOfMonth(parseISO(monthStr + "-01")),
            },
          },
          orderBy: { date: "asc" },
        })
      : await db.gymDay.findMany({
          orderBy: { date: "desc" },
          take: 90,
        });

    return NextResponse.json({ entries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { date, didGo } = await request.json();
    const entry = await db.gymDay.upsert({
      where: { date: parseISO(date) },
      update: { didGo },
      create: { date: parseISO(date), didGo },
    });
    return NextResponse.json(entry);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
