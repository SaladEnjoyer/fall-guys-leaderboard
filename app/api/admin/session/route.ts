import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { ok: isAdmin(request) },
    { headers: { "Cache-Control": "no-store" } },
  )
}
