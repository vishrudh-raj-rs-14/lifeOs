import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO } from "date-fns";
import { BookStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const books = await db.book.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ books });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, author, totalPages, startDate, genre } = await request.json();
    const book = await db.book.create({
      data: {
        title,
        author,
        totalPages: totalPages ? parseInt(totalPages) : null,
        startDate: parseISO(startDate),
        genre,
        status: "READING",
      },
    });
    return NextResponse.json(book);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, currentPage, status, summaryNotes, endDate } = await request.json();
    const book = await db.book.update({
      where: { id },
      data: {
        ...(currentPage !== undefined && { currentPage }),
        ...(status && { status: status as BookStatus }),
        ...(summaryNotes !== undefined && { summaryNotes }),
        ...(endDate && { endDate: parseISO(endDate) }),
      },
    });
    return NextResponse.json(book);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    await db.book.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
