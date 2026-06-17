import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO } from "date-fns";
import { WorkoutType } from "@prisma/client";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const entries = await db.workout.findMany({
      orderBy: { date: "desc" },
      take: 50,
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
    const { date, type, exercises, notes } = await request.json();
    const dateObj = parseISO(date);

    // Create workout and auto-mark gym day in parallel
    const [entry] = await Promise.all([
      db.workout.create({
        data: { date: dateObj, type: type as WorkoutType, exercises, notes },
      }),
      // Logging a workout = going to gym that day
      db.gymDay.upsert({
        where: { date: dateObj },
        update: { didGo: true },
        create: { date: dateObj, didGo: true },
      }),
    ]);

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
    const workout = await db.workout.findUnique({ where: { id } });
    await db.workout.delete({ where: { id } });

    // If no more workouts for that day, remove the auto-generated gym day
    if (workout) {
      const remaining = await db.workout.count({ where: { date: workout.date } });
      if (remaining === 0) {
        await db.gymDay.deleteMany({ where: { date: workout.date } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
