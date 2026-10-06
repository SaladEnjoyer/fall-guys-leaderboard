import { NextRequest, NextResponse } from "next/server"
import { passwordsMatch, adminPassword, setAdminCookie } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null
  const password = typeof body?.password === "string" ? body.password : ""
  if (!passwordsMatch(password, adminPassword())) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  setAdminCookie(response)
  return response
}
