import { NextRequest, NextResponse } from "next/server";
import { verifyPin, createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const valid = await verifyPin(pin);
    if (!valid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const token = await createSession();
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
