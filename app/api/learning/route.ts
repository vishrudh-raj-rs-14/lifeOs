import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const entries = await db.learningLog.findMany({
      where: search
        ? {
            OR: [
              { content: { contains: search, mode: "insensitive" } },
              { tags: { has: search } },
            ],
          }
        : {},
      orderBy: { date: "desc" },
      take: 100,
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
    const { date, content, tags } = await request.json();
    const entry = await db.learningLog.upsert({
      where: { date: parseISO(date) },
      update: { content, tags: tags || [] },
      create: { date: parseISO(date), content, tags: tags || [] },
    });
    return NextResponse.json(entry);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
