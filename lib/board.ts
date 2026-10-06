import { matchPhase } from "@/lib/fixtures"
import { computeStandings, describeZones } from "@/lib/standings"
import type { Board, LeagueState, Lobby, MatchView } from "@/lib/types"

function displayName(
  playerId: string,
  snapshot: string,
  names: Map<string, string>,
) {
  return names.get(playerId) ?? snapshot
}

function scoredLobby(lobby: Lobby) {
  return (
    lobby.scoreA != null &&
    lobby.scoreB != null &&
    lobby.scoreA !== lobby.scoreB
  )
}

function lobbyWins(lobby: Lobby, side: "A" | "B") {
  if (lobby.scoreA == null || lobby.scoreB == null || lobby.scoreA === lobby.scoreB) {
    return 0
  }
  const winner = lobby.scoreA > lobby.scoreB ? "A" : "B"
  return winner === side ? 1 : 0
}

export function buildBoard(state: LeagueState, now = Date.now()): Board {
  const names = new Map(state.players.map((player) => [player.id, player.name]))

  return {
    updatedAt: new Date(now).toISOString(),
    leagues: state.leagues.map((league) => {
      const players = state.players
        .filter((player) => player.leagueId === league.id)
        .sort((a, b) =>
          a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
        )
      const matches = state.matches
        .filter((match) => match.leagueId === league.id)
        .sort((a, b) => {
          if (a.round !== b.round) return a.round - b.round
          if (a.playedAt && b.playedAt && a.playedAt !== b.playedAt) {
            return a.playedAt < b.playedAt ? 1 : -1
          }
          return a.playerAName.localeCompare(b.playerAName, "en", { sensitivity: "base" })
        })

      const lobbies = matches.flatMap((match) => {
        const played = [match.lobby1, match.lobby2].filter(scoredLobby)
        return played.map((lobby) => ({
          playerAId: match.playerAId,
          playerBId: match.playerBId,
          scoreA: lobby.scoreA as number,
          scoreB: lobby.scoreB as number,
        }))
      })

      const matchViews: MatchView[] = matches.map((match) => {
        const phase = matchPhase(match, now)
        return {
          id: match.id,
          round: match.round,
          createdAt: match.createdAt,
          opensAt: match.opensAt,
          deadlineAt: match.deadlineAt,
          releaseAt: match.releaseAt,
          released: phase === "active" || phase === "closed" || phase === "forfeit",
          playedAt: match.playedAt,
          phase,
          hidden: phase === "upcoming" || phase === "forfeit",
          playerAId: match.playerAId,
          playerBId: match.playerBId,
          playerAName: displayName(match.playerAId, match.playerAName, names),
          playerBName: displayName(match.playerBId, match.playerBName, names),
          lobby1: match.lobby1,
          lobby2: match.lobby2,
          lobbyWinsA: lobbyWins(match.lobby1, "A") + lobbyWins(match.lobby2, "A"),
          lobbyWinsB: lobbyWins(match.lobby1, "B") + lobbyWins(match.lobby2, "B"),
        }
      })

      return {
        id: league.id,
        name: league.name,
        accent: league.accent,
        promotionSlots: league.promotionSlots,
        relegationSlots: league.relegationSlots,
        zoneSummary: describeZones(
          league.promotionSlots,
          league.relegationSlots,
        ),
        zonesOverlap:
          players.length > 0 &&
          league.promotionSlots + league.relegationSlots > players.length,
        players: players.map((player) => ({
          id: player.id,
          name: player.name,
          server: player.server,
        })),
        standings: computeStandings(
          players,
          lobbies,
          league.promotionSlots,
          league.relegationSlots,
          lobbies.length,
        ),
        matches: matchViews,
      }
    }),
  }
}
