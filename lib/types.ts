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
  server: string
  createdAt: string
}

export type Lobby = {
  scoreA: number | null
  scoreB: number | null
  server: string
}

export type Match = {
  id: string
  leagueId: string
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  lobby1: Lobby
  lobby2: Lobby
  releaseAt: string | null
  released: boolean
  playedAt: string | null
  createdAt: string
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
  server: string
  position: number
  played: number
  wins: number
  losses: number
  roundsFor: number
  roundsAgainst: number
  roundDiff: number
  points: number
  zone: Zone
}

export type LobbyView = {
  scoreA: number | null
  scoreB: number | null
  server: string
}

export type MatchView = {
  id: string
  createdAt: string
  releaseAt: string | null
  released: boolean
  playedAt: string | null
  hidden: boolean
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
  lobby1: LobbyView
  lobby2: LobbyView
  lobbyWinsA: number
  lobbyWinsB: number
}

export type LeagueView = {
  id: string
  name: string
  accent: LeagueAccent
  promotionSlots: number
  relegationSlots: number
  zoneSummary: string
  zonesOverlap: boolean
  players: { id: string; name: string; server: string }[]
  standings: StandingRow[]
  matches: MatchView[]
}

export type Board = {
  updatedAt: string
  leagues: LeagueView[]
}

export type AdminAction =
  | { type: "add-player"; leagueId: string; name: string; server: string }
  | { type: "rename-player"; playerId: string; name: string; server: string }
  | { type: "remove-player"; playerId: string }
  | { type: "generate-fixtures"; leagueId: string }
  | {
      type: "schedule-releases"
      leagueId: string
      firstMinutes: number
      everyMinutes: number
    }
  | { type: "clear-schedule"; leagueId: string }
  | { type: "release-match"; matchId: string }
  | {
      type: "record-result"
      matchId: string
      lobby1Server: string
      lobby2Server: string
      lobby1ScoreA: number
      lobby1ScoreB: number
      lobby2ScoreA: number
      lobby2ScoreB: number
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
