import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { buildBoard } from "@/lib/board"
import { createInitialState } from "@/lib/defaults"
import { fixtureIsVisible, missingPairs } from "@/lib/fixtures"
import { scoreError } from "@/lib/rules"
import type {
  AdminAction,
  Board,
  League,
  LeagueState,
  Lobby,
  Match,
  Player,
} from "@/lib/types"

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

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 30
}

function readLobby(value: unknown, fallbackServer: string): Lobby | null {
  if (!isRecord(value)) return { scoreA: null, scoreB: null, server: fallbackServer }
  const server =
    typeof value.server === "string" ? value.server.trim().slice(0, 16) : fallbackServer
  const blankA = value.scoreA == null
  const blankB = value.scoreB == null
  if (blankA && blankB) return { scoreA: null, scoreB: null, server }
  if (!isScore(value.scoreA) || !isScore(value.scoreB)) return null
  return { scoreA: value.scoreA, scoreB: value.scoreB, server }
}

function normalize(raw: unknown): LeagueState {
  const initial = createInitialState()
  if (!isRecord(raw)) return initial

  const leagues = initial.leagues.map((league) => {
    const incoming = Array.isArray(raw.leagues)
      ? raw.leagues.find((item) => isRecord(item) && item.id === league.id)
      : undefined
    if (!isRecord(incoming)) return league
    return {
      ...league,
      name:
        typeof incoming.name === "string" && incoming.name.trim()
          ? incoming.name.trim().slice(0, 24)
          : league.name,
      promotionSlots: clampSlot(incoming.promotionSlots, league.promotionSlots),
      relegationSlots: clampSlot(incoming.relegationSlots, league.relegationSlots),
    }
  })

  const players = Array.isArray(raw.players)
    ? raw.players.flatMap((item) => {
        if (!isRecord(item)) return []
        if (typeof item.id !== "string" || typeof item.leagueId !== "string") return []
        if (!leagues.some((league) => league.id === item.leagueId)) return []
        if (typeof item.name !== "string" || !item.name.trim()) return []
        const player: Player = {
          id: item.id,
          leagueId: item.leagueId,
          name: item.name.trim().slice(0, 24),
          server: typeof item.server === "string" ? item.server.trim().slice(0, 16) : "",
          createdAt:
            typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString(),
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
        if (!playerIds.has(item.playerAId) || !playerIds.has(item.playerBId)) return []
        if (item.playerAId === item.playerBId) return []
        const home = players.find((player) => player.id === item.playerAId)
        const away = players.find((player) => player.id === item.playerBId)
        const lobby1 = readLobby(item.lobby1, home?.server ?? "")
        const lobby2 = readLobby(item.lobby2, away?.server ?? "")
        if (!lobby1 || !lobby2) return []
        const complete = lobby1.scoreA != null && lobby2.scoreA != null
        const createdAt =
          typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString()
        const match: Match = {
          id: item.id,
          leagueId: item.leagueId,
          playerAId: item.playerAId,
          playerBId: item.playerBId,
          playerAName: typeof item.playerAName === "string" ? item.playerAName : home?.name ?? "Player",
          playerBName: typeof item.playerBName === "string" ? item.playerBName : away?.name ?? "Player",
          lobby1,
          lobby2,
          releaseAt: typeof item.releaseAt === "string" ? item.releaseAt : null,
          released: item.released === true || complete,
          playedAt:
            typeof item.playedAt === "string" ? item.playedAt : complete ? createdAt : null,
          createdAt,
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
  if (typeof value !== "string") throw new ActionError(400, `Enter ${label}.`)
  const name = value.trim().replace(/\s+/g, " ")
  if (!name) throw new ActionError(400, `Enter ${label}.`)
  if (name.length > 24) throw new ActionError(400, `${label} can be up to 24 characters.`)
  return name
}

function cleanServer(value: unknown) {
  if (typeof value !== "string") throw new ActionError(400, "Enter a server.")
  const server = value.trim().replace(/\s+/g, " ")
  if (!server) throw new ActionError(400, "Enter a server.")
  if (server.length > 16) throw new ActionError(400, "A server name can be up to 16 characters.")
  return server
}

function requireSlot(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 12) {
    throw new ActionError(400, `${label} has to be a whole number from 0 to 12.`)
  }
  return value
}

function requireMinutes(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10080) {
    throw new ActionError(400, `${label} has to be a whole number of minutes from 0 to 10080.`)
  }
  return value
}

function sameName(left: string, right: string) {
  return left.localeCompare(right, "en", { sensitivity: "base" }) === 0
}

function applyLobbyScore(label: string, scoreA: number, scoreB: number) {
  const invalid = scoreError(scoreA, scoreB)
  if (invalid) throw new ActionError(400, `${label}: ${invalid}`)
}

function syncOpenLobbies(state: LeagueState, player: Player) {
  for (const match of state.matches) {
    if (match.playedAt) continue
    if (match.playerAId === player.id) match.lobby1.server = player.server
    if (match.playerBId === player.id) match.lobby2.server = player.server
  }
}

function applyAction(state: LeagueState, action: AdminAction) {
  switch (action.type) {
    case "add-player": {
      const league = requireLeague(state, action.leagueId)
      const name = cleanName(action.name, "a name")
      const server = cleanServer(action.server)
      const duplicate = state.players.some(
        (player) => player.leagueId === league.id && sameName(player.name, name),
      )
      if (duplicate) throw new ActionError(400, "That name is already in this league.")
      state.players.push({
        id: randomUUID(),
        leagueId: league.id,
        name,
        server,
        createdAt: new Date().toISOString(),
      })
      return
    }
    case "rename-player": {
      const player = state.players.find((item) => item.id === action.playerId)
      if (!player) throw new ActionError(400, "That player is not in the league.")
      const name = cleanName(action.name, "a name")
      const server = cleanServer(action.server)
      const duplicate = state.players.some(
        (item) =>
          item.id !== player.id && item.leagueId === player.leagueId && sameName(item.name, name),
      )
      if (duplicate) throw new ActionError(400, "That name is already in this league.")
      player.name = name
      player.server = server
      for (const match of state.matches) {
        if (match.playerAId === player.id) match.playerAName = name
        if (match.playerBId === player.id) match.playerBName = name
      }
      syncOpenLobbies(state, player)
      return
    }
    case "remove-player": {
      const player = state.players.find((item) => item.id === action.playerId)
      if (!player) throw new ActionError(400, "That player is not in the league.")
      state.players = state.players.filter((item) => item.id !== player.id)
      state.matches = state.matches.filter(
        (match) => match.playerAId !== player.id && match.playerBId !== player.id,
      )
      return
    }
    case "generate-fixtures": {
      const league = requireLeague(state, action.leagueId)
      const players = state.players
        .filter((player) => player.leagueId === league.id)
        .sort((a, b) => {
          const byName = a.name.localeCompare(b.name, "en", { sensitivity: "base" })
          return byName === 0 ? (a.id < b.id ? -1 : 1) : byName
        })
      if (players.length < 2) throw new ActionError(400, "Add at least two players first.")
      const missing = players.filter((player) => !player.server)
      if (missing.length > 0) {
        throw new ActionError(400, "Every player needs a server before matchups can be created.")
      }
      const existing = state.matches.filter((match) => match.leagueId === league.id)
      const pairs = missingPairs(players.map((player) => player.id), existing)
      if (pairs.length === 0) {
        throw new ActionError(400, "Everyone in this league already has a matchup.")
      }
      const byId = new Map(players.map((player) => [player.id, player]))
      const started = Date.now()
      pairs.forEach(([leftId, rightId], index) => {
        const left = byId.get(leftId)
        const right = byId.get(rightId)
        if (!left || !right) return
        state.matches.push({
          id: randomUUID(),
          leagueId: league.id,
          playerAId: left.id,
          playerBId: right.id,
          playerAName: left.name,
          playerBName: right.name,
          lobby1: { scoreA: null, scoreB: null, server: left.server },
          lobby2: { scoreA: null, scoreB: null, server: right.server },
          releaseAt: null,
          released: false,
          playedAt: null,
          createdAt: new Date(started + index).toISOString(),
        })
      })
      return
    }
    case "schedule-releases": {
      const league = requireLeague(state, action.leagueId)
      const firstMinutes = requireMinutes(action.firstMinutes, "The first release")
      const everyMinutes = requireMinutes(action.everyMinutes, "The gap between releases")
      const now = Date.now()
      const pending = state.matches
        .filter(
          (match) => match.leagueId === league.id && !fixtureIsVisible(match, now) && !match.playedAt,
        )
        .sort((a, b) => {
          if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
          return a.id < b.id ? -1 : 1
        })
      if (pending.length === 0) {
        throw new ActionError(400, "There are no hidden matchups to schedule.")
      }
      pending.forEach((match, index) => {
        const minutes = firstMinutes + index * everyMinutes
        match.releaseAt = new Date(now + minutes * 60_000).toISOString()
        match.released = false
      })
      return
    }
    case "clear-schedule": {
      const league = requireLeague(state, action.leagueId)
      const now = Date.now()
      let cleared = 0
      for (const match of state.matches) {
        if (match.leagueId !== league.id || match.playedAt || !match.releaseAt) continue
        if (fixtureIsVisible(match, now)) continue
        match.releaseAt = null
        cleared += 1
      }
      if (cleared === 0) throw new ActionError(400, "There is no timer to clear.")
      return
    }
    case "release-match": {
      const match = state.matches.find((item) => item.id === action.matchId)
      if (!match) throw new ActionError(400, "That matchup is already gone.")
      match.released = true
      return
    }
    case "record-result": {
      const match = state.matches.find((item) => item.id === action.matchId)
      if (!match) throw new ActionError(400, "That matchup is already gone.")
      applyLobbyScore("Lobby 1", action.lobby1ScoreA, action.lobby1ScoreB)
      applyLobbyScore("Lobby 2", action.lobby2ScoreA, action.lobby2ScoreB)
      match.lobby1 = {
        scoreA: action.lobby1ScoreA,
        scoreB: action.lobby1ScoreB,
        server: cleanServer(action.lobby1Server),
      }
      match.lobby2 = {
        scoreA: action.lobby2ScoreA,
        scoreB: action.lobby2ScoreB,
        server: cleanServer(action.lobby2Server),
      }
      match.playedAt = new Date().toISOString()
      match.released = true
      return
    }
    case "remove-match": {
      const before = state.matches.length
      state.matches = state.matches.filter((match) => match.id !== action.matchId)
      if (state.matches.length === before) throw new ActionError(400, "That matchup is already gone.")
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
