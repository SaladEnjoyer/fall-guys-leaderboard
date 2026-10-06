import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { buildBoard } from "@/lib/board"
import { createInitialState } from "@/lib/defaults"
import { isServerSetup, scoreError } from "@/lib/rules"
import type { AdminAction, Board, League, LeagueState, Match, Player } from "@/lib/types"

const dataFile = path.join(process.cwd(), "data", "league.json")

class ActionError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>) {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalize(raw: unknown): LeagueState {
  const initial = createInitialState()
  if (!isRecord(raw)) return initial

  const leagues = initial.leagues.map((league) => {
    const incoming = Array.isArray(raw.leagues)
      ? raw.leagues.find(
          (item) => isRecord(item) && item.id === league.id,
        )
      : undefined
    if (!isRecord(incoming)) return league
    return {
      ...league,
      name:
        typeof incoming.name === "string" && incoming.name.trim()
          ? incoming.name.trim().slice(0, 24)
          : league.name,
      promotionSlots: clampSlot(incoming.promotionSlots, league.promotionSlots),
      relegationSlots: clampSlot(
        incoming.relegationSlots,
        league.relegationSlots,
      ),
    }
  })

  const players = Array.isArray(raw.players)
    ? raw.players.flatMap((item) => {
        if (!isRecord(item)) return []
        if (typeof item.id !== "string" || typeof item.leagueId !== "string") {
          return []
        }
        if (!leagues.some((league) => league.id === item.leagueId)) return []
        if (typeof item.name !== "string" || !item.name.trim()) return []
        const player: Player = {
          id: item.id,
          leagueId: item.leagueId,
          name: item.name.trim().slice(0, 24),
          createdAt:
            typeof item.createdAt === "string"
              ? item.createdAt
              : new Date(0).toISOString(),
        }
        return [player]
      })
    : []

  const playerIds = new Set(players.map((player) => player.id))
  const matches = Array.isArray(raw.matches)
    ? raw.matches.flatMap((item) => {
        if (!isRecord(item)) return []
        if (
          typeof item.id !== "string" ||
          typeof item.leagueId !== "string" ||
          typeof item.playerAId !== "string" ||
          typeof item.playerBId !== "string"
        ) {
          return []
        }
        if (!leagues.some((league) => league.id === item.leagueId)) return []
        if (!playerIds.has(item.playerAId) || !playerIds.has(item.playerBId)) {
          return []
        }
        if (item.playerAId === item.playerBId) return []
        const scoreA = item.scoreA
        const scoreB = item.scoreB
        if (!isScore(scoreA) || !isScore(scoreB)) return []
        const match: Match = {
          id: item.id,
          leagueId: item.leagueId,
          playerAId: item.playerAId,
          playerBId: item.playerBId,
          playerAName:
            typeof item.playerAName === "string" ? item.playerAName : "Player",
          playerBName:
            typeof item.playerBName === "string" ? item.playerBName : "Player",
          scoreA,
          scoreB,
          servers: isServerSetup(item.servers) ? item.servers : "split",
          playedAt:
            typeof item.playedAt === "string"
              ? item.playedAt
              : new Date(0).toISOString(),
        }
        return [match]
      })
    : []

  return { leagues, players, matches }
}

function clampSlot(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback
  return Math.min(12, Math.max(0, value))
}

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 30
}

async function load() {
  try {
    const raw = await readFile(dataFile, "utf8")
    return normalize(JSON.parse(raw) as unknown)
  } catch {
    const initial = createInitialState()
    await persist(initial)
    return initial
  }
}

async function persist(state: LeagueState) {
  await mkdir(path.dirname(dataFile), { recursive: true })
  const tempFile = `${dataFile}.tmp`
  await writeFile(tempFile, JSON.stringify(state, null, 2))
  await rename(tempFile, dataFile)
}

function requireLeague(state: LeagueState, leagueId: string) {
  const league = state.leagues.find((item) => item.id === leagueId)
  if (!league) throw new ActionError(400, "That league does not exist.")
  return league
}

function cleanName(value: unknown, label: string) {
  if (typeof value !== "string") {
    throw new ActionError(400, `Enter ${label}.`)
  }
  const name = value.trim().replace(/\s+/g, " ")
  if (!name) throw new ActionError(400, `Enter ${label}.`)
  if (name.length > 24) {
    throw new ActionError(400, `${label} can be up to 24 characters.`)
  }
  return name
}

function requireSlot(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 12) {
    throw new ActionError(
      400,
      `${label} has to be a whole number from 0 to 12.`,
    )
  }
  return value
}

function applyAction(state: LeagueState, action: AdminAction) {
  switch (action.type) {
    case "add-player": {
      const league = requireLeague(state, action.leagueId)
      const name = cleanName(action.name, "a name")
      const duplicate = state.players.some(
        (player) =>
          player.leagueId === league.id &&
          player.name.localeCompare(name, "en", { sensitivity: "base" }) === 0,
      )
      if (duplicate) {
        throw new ActionError(400, "That name is already in this league.")
      }
      state.players.push({
        id: randomUUID(),
        leagueId: league.id,
        name,
        createdAt: new Date().toISOString(),
      })
      return
    }
    case "rename-player": {
      const player = state.players.find((item) => item.id === action.playerId)
      if (!player) throw new ActionError(400, "That player is not in the league.")
      const name = cleanName(action.name, "a name")
      const duplicate = state.players.some(
        (item) =>
          item.id !== player.id &&
          item.leagueId === player.leagueId &&
          item.name.localeCompare(name, "en", { sensitivity: "base" }) === 0,
      )
      if (duplicate) {
        throw new ActionError(400, "That name is already in this league.")
      }
      player.name = name
      return
    }
    case "remove-player": {
      const player = state.players.find((item) => item.id === action.playerId)
      if (!player) throw new ActionError(400, "That player is not in the league.")
      state.players = state.players.filter((item) => item.id !== player.id)
      state.matches = state.matches.filter(
        (match) =>
          match.playerAId !== player.id && match.playerBId !== player.id,
      )
      return
    }
    case "add-match": {
      const league = requireLeague(state, action.leagueId)
      if (action.playerAId === action.playerBId) {
        throw new ActionError(400, "Pick two different players.")
      }
      const playerA = state.players.find(
        (player) => player.id === action.playerAId && player.leagueId === league.id,
      )
      const playerB = state.players.find(
        (player) => player.id === action.playerBId && player.leagueId === league.id,
      )
      if (!playerA || !playerB) {
        throw new ActionError(400, "Both players have to be in this league.")
      }
      const invalidScore = scoreError(action.scoreA, action.scoreB)
      if (invalidScore) throw new ActionError(400, invalidScore)
      if (!isServerSetup(action.servers)) {
        throw new ActionError(400, "Pick split servers or same server.")
      }
      state.matches.push({
        id: randomUUID(),
        leagueId: league.id,
        playerAId: playerA.id,
        playerBId: playerB.id,
        playerAName: playerA.name,
        playerBName: playerB.name,
        scoreA: action.scoreA,
        scoreB: action.scoreB,
        servers: action.servers,
        playedAt: new Date().toISOString(),
      })
      return
    }
    case "remove-match": {
      const before = state.matches.length
      state.matches = state.matches.filter((match) => match.id !== action.matchId)
      if (state.matches.length === before) {
        throw new ActionError(400, "That match is already gone.")
      }
      return
    }
    case "update-zones": {
      const league: League = requireLeague(state, action.leagueId)
      league.promotionSlots = requireSlot(action.promotionSlots, "Promotion spots")
      league.relegationSlots = requireSlot(action.relegationSlots, "Relegation spots")
      return
    }
    case "rename-league": {
      const league = requireLeague(state, action.leagueId)
      league.name = cleanName(action.name, "the league name")
      return
    }
    case "reset-matches": {
      const league = requireLeague(state, action.leagueId)
      state.matches = state.matches.filter((match) => match.leagueId !== league.id)
      return
    }
    default: {
      throw new ActionError(400, "That action was not recognized.")
    }
  }
}

export function readBoard(): Promise<Board> {
  return enqueue(async () => buildBoard(await load()))
}

export function mutateBoard(action: AdminAction): Promise<Board> {
  return enqueue(async () => {
    const state = await load()
    applyAction(state, action)
    await persist(state)
    return buildBoard(state)
  })
}

export function actionStatus(error: unknown) {
  if (error instanceof ActionError) return error.status
  return 500
}

export function actionMessage(error: unknown) {
  if (error instanceof ActionError) return error.message
  return "The change could not be saved."
}
