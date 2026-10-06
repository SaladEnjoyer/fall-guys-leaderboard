export type LeagueAccent = "gold" | "violet" | "cyan" | "pink" | "lime"

export type League = {
  id: string
  name: string
  accent: LeagueAccent
  promotionSlots: number
  relegationSlots: number
}

export type Player = {
  id: string
  leagueId: string
  name: string
  createdAt: string
}

export type ServerSetup = "split" | "same"

export type Match = {
  id: string
  leagueId: string
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  scoreA: number
  scoreB: number
  servers: ServerSetup
  playedAt: string
}

export type LeagueState = {
  leagues: League[]
  players: Player[]
  matches: Match[]
}

export type Zone = "promotion" | "relegation" | "contested" | "mid" | "none"

export type StandingRow = {
  playerId: string
  name: string
  position: number
  played: number
  wins: number
  draws: number
  losses: number
  roundsFor: number
  roundsAgainst: number
  roundDiff: number
  points: number
  zone: Zone
}

export type MatchView = {
  id: string
  playedAt: string
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  scoreA: number
  scoreB: number
  servers: ServerSetup
  result: "A" | "B" | "draw"
}

export type LeagueView = {
  id: string
  name: string
  accent: LeagueAccent
  promotionSlots: number
  relegationSlots: number
  zoneSummary: string
  zonesOverlap: boolean
  players: { id: string; name: string }[]
  standings: StandingRow[]
  matches: MatchView[]
}

export type Board = {
  updatedAt: string
  leagues: LeagueView[]
}

export type AdminAction =
  | { type: "add-player"; leagueId: string; name: string }
  | { type: "rename-player"; playerId: string; name: string }
  | { type: "remove-player"; playerId: string }
  | {
      type: "add-match"
      leagueId: string
      playerAId: string
      playerBId: string
      scoreA: number
      scoreB: number
      servers: ServerSetup
    }
  | { type: "remove-match"; matchId: string }
  | {
      type: "update-zones"
      leagueId: string
      promotionSlots: number
      relegationSlots: number
    }
  | { type: "rename-league"; leagueId: string; name: string }
  | { type: "reset-matches"; leagueId: string }
