import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const entries = await db.steps.findMany({
      orderBy: { date: "desc" },
      take: 60,
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
    const { date, count } = await request.json();
    const entry = await db.steps.upsert({
      where: { date: parseISO(date) },
      update: { count },
      create: { date: parseISO(date), count },
    });
    return NextResponse.json(entry);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
