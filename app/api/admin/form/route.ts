import { NextRequest, NextResponse } from "next/server"
import {
  adminPassword,
  clearAdminCookie,
  isAdmin,
  passwordsMatch,
  setAdminCookie,
} from "@/lib/auth"
import { actionMessage, mutateBoard } from "@/lib/store"
import type { AdminAction } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function text(form: FormData, key: string) {
  const value = form.get(key)
  return typeof value === "string" ? value : ""
}

function whole(form: FormData, key: string) {
  return Number(text(form, key))
}

function actionFromForm(form: FormData): AdminAction {
  const intent = text(form, "intent")
  const leagueId = text(form, "leagueId")

  switch (intent) {
    case "add-player":
      return {
        type: "add-player",
        leagueId,
        name: text(form, "name"),
        server: text(form, "server"),
      }
    case "rename-player":
      return {
        type: "rename-player",
        playerId: text(form, "playerId"),
        name: text(form, "name"),
        server: text(form, "server"),
      }
    case "remove-player":
      return { type: "remove-player", playerId: text(form, "playerId") }
    case "generate-fixtures":
      return { type: "generate-fixtures", leagueId }
    case "schedule-releases":
      return {
        type: "schedule-releases",
        leagueId,
        firstMinutes: whole(form, "firstMinutes"),
        everyMinutes: whole(form, "everyMinutes"),
      }
    case "clear-schedule":
      return { type: "clear-schedule", leagueId }
    case "release-match":
      return { type: "release-match", matchId: text(form, "matchId") }
    case "record-result":
      return {
        type: "record-result",
        matchId: text(form, "matchId"),
        lobby1Server: text(form, "lobby1Server"),
        lobby2Server: text(form, "lobby2Server"),
        lobby1ScoreA: whole(form, "lobby1ScoreA"),
        lobby1ScoreB: whole(form, "lobby1ScoreB"),
        lobby2ScoreA: whole(form, "lobby2ScoreA"),
        lobby2ScoreB: whole(form, "lobby2ScoreB"),
      }
    case "remove-match":
      return { type: "remove-match", matchId: text(form, "matchId") }
    case "update-zones":
      return {
        type: "update-zones",
        leagueId,
        promotionSlots: whole(form, "promotionSlots"),
        relegationSlots: whole(form, "relegationSlots"),
      }
    case "rename-league":
      return { type: "rename-league", leagueId, name: text(form, "name") }
    case "reset-matches":
      return { type: "reset-matches", leagueId }
    default:
      throw new Error("That action was not recognized.")
  }
}

function desk(request: NextRequest, leagueId: string, query: Record<string, string>) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "127.0.0.1:43123"
  const proto = request.headers.get("x-forwarded-proto") || "http"
  const url = new URL("/admin", `${proto}://${host}`)
  if (leagueId) url.searchParams.set("league", leagueId)
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url, 303)
}

const saved: Record<string, string> = {
  "add-player": "Player added.",
  "rename-player": "Player updated.",
  "remove-player": "Player removed. Their matchups were deleted.",
  "generate-fixtures": "Matchups created. They stay hidden until you release them.",
  "schedule-releases": "Timer set. Each hidden matchup will appear on its own.",
  "clear-schedule": "Timer cleared. Hidden matchups stay hidden.",
  "release-match": "Matchup released.",
  "record-result": "Result saved. The table is updated.",
  "remove-match": "Matchup deleted. The table was recalculated.",
  "update-zones": "Cuts updated.",
  "rename-league": "League renamed.",
  "reset-matches": "Matchups in this league were reset.",
}

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const intent = text(form, "intent")
  const leagueId = text(form, "leagueId") || "liga-1"

  if (intent === "login") {
    if (!passwordsMatch(text(form, "password"), adminPassword())) {
      return desk(request, "", { error: "Wrong password." })
    }
    const response = desk(request, leagueId, {})
    setAdminCookie(response)
    return response
  }

  if (intent === "logout") {
    const response = desk(request, "", {})
    clearAdminCookie(response)
    return response
  }

  if (!isAdmin(request)) {
    return desk(request, leagueId, { error: "Sign in to update the league." })
  }

  try {
    const action = actionFromForm(form)
    await mutateBoard(action)
    return desk(request, leagueId, { notice: saved[action.type] ?? "Saved." })
  } catch (error) {
    const message =
      error instanceof Error && error.message === "That action was not recognized."
        ? error.message
        : actionMessage(error)
    return desk(request, leagueId, { error: message })
  }
}
