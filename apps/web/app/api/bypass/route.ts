// JEDEVIENSPATRON — Route API de validation des codes bypass
// POST /api/bypass   { "code": "XXXXXXXX" }
// Réponse: { "valid": true } ou { "valid": false }

import { NextRequest, NextResponse } from "next/server";
import { isBypassCode } from "@/lib/bypass-codes.server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    const valid = isBypassCode(code);
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
