import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRequest } from "@/lib/auth";
import { parseISO, format } from "date-fns";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "weight");

async function ensureDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function GET(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const photos = await db.weightPhoto.findMany({
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({
      photos: photos.map((p) => ({
        id: p.id,
        date: format(p.date, "yyyy-MM-dd"),
        filename: p.filename,
        url: `/api/weight/photos/${p.filename}`,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureDir();
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const dateStr = formData.get("date") as string;

    if (!file || !dateStr) {
      return NextResponse.json({ error: "Missing photo or date" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert any format (including HEIC) → JPEG, resize to max 1200px
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const outPath = path.join(UPLOADS_DIR, filename);

    await sharp(buffer)
      .rotate() // auto-orient from EXIF
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outPath);

    const photo = await db.weightPhoto.create({
      data: { date: parseISO(dateStr), filename },
    });

    return NextResponse.json({
      id: photo.id,
      date: format(photo.date, "yyyy-MM-dd"),
      filename: photo.filename,
      url: `/api/weight/photos/${filename}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    const photo = await db.weightPhoto.findUnique({ where: { id } });
    if (photo) {
      await db.weightPhoto.delete({ where: { id } });
      const filePath = path.join(UPLOADS_DIR, photo.filename);
      await fs.unlink(filePath).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
