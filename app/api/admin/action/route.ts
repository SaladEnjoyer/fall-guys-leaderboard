import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/auth"
import { actionMessage, actionStatus, mutateBoard } from "@/lib/store"
import type { AdminAction } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const actions = new Set<AdminAction["type"]>([
  "add-player",
  "rename-player",
  "remove-player",
  "add-match",
  "remove-match",
  "update-zones",
  "rename-league",
  "reset-matches",
])

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: "Entra con la clave para actualizar la liga." },
      { status: 401 },
    )
  }

  const body = (await request.json().catch(() => null)) as AdminAction | null
  if (!body || typeof body !== "object" || !actions.has(body.type)) {
    return NextResponse.json({ error: "No reconocí esa acción." }, { status: 400 })
  }

  try {
    const board = await mutateBoard(body)
    return NextResponse.json(board, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return NextResponse.json(
      { error: actionMessage(error) },
      { status: actionStatus(error) },
    )
  }
}
