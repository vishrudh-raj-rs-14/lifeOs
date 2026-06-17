import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { fetchCfProblem, fetchCfUserRating } from "@/lib/codeforces";
import { parseCfUrl } from "@/lib/utils";
import { parseISO, format } from "date-fns";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "rating") {
      const rating = await fetchCfUserRating();
      return NextResponse.json({ rating });
    }

    const problems = await db.cfProblem.findMany({
      orderBy: { date: "desc" },
      take: 200,
    });

    // Group by date, pick max rating if 3+ on same day
    const grouped: Record<string, typeof problems> = {};
    for (const p of problems) {
      const key = format(p.date, "yyyy-MM-dd");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }

    return NextResponse.json({ problems, grouped });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { link, date, ratingOverride, nameOverride } = await request.json();

    const parsed = parseCfUrl(link);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid Codeforces URL" }, { status: 400 });
    }

    let name = nameOverride;
    let rating = ratingOverride;

    if (!name) {
      const info = await fetchCfProblem(parsed.contestId, parsed.index);
      if (info) {
        name = info.name;
        if (!rating) rating = info.rating;
      }
    }

    if (!name) {
      name = `${parsed.contestId}${parsed.index}`;
    }

    const entry = await db.cfProblem.create({
      data: {
        date: parseISO(date),
        contestId: parsed.contestId,
        problemIndex: parsed.index,
        name,
        rating: rating ? parseInt(rating) : null,
        link,
      },
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
    await db.cfProblem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
