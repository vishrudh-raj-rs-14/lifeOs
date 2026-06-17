import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "weight");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  if (!await verifyRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { filename } = await params;
    // Security: prevent path traversal
    const safe = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safe);
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
