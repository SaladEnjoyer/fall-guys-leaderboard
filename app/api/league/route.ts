import { NextResponse } from "next/server"
import { readBoard } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const board = await readBoard()
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  })
}
