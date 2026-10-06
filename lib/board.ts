import { isServerSetup } from "@/lib/rules"
import { computeStandings, describeZones } from "@/lib/standings"
import type { Board, LeagueState, MatchView } from "@/lib/types"

function displayName(
  playerId: string,
  snapshot: string,
  names: Map<string, string>,
) {
  return names.get(playerId) ?? snapshot
}

export function buildBoard(state: LeagueState): Board {
  const names = new Map(state.players.map((player) => [player.id, player.name]))

  return {
    updatedAt: new Date().toISOString(),
    leagues: state.leagues.map((league) => {
      const players = state.players
        .filter((player) => player.leagueId === league.id)
        .sort((a, b) =>
          a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
        )
      const matches = state.matches
        .filter((match) => match.leagueId === league.id)
        .sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1))

      const matchViews: MatchView[] = matches.map((match) => ({
        id: match.id,
        playedAt: match.playedAt,
        playerAId: match.playerAId,
        playerBId: match.playerBId,
        playerAName: displayName(match.playerAId, match.playerAName, names),
        playerBName: displayName(match.playerBId, match.playerBName, names),
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        servers: isServerSetup(match.servers) ? match.servers : "split",
        result:
          match.scoreA === match.scoreB
            ? "draw"
            : match.scoreA > match.scoreB
              ? "A"
              : "B",
      }))

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
        players: players.map((player) => ({ id: player.id, name: player.name })),
        standings: computeStandings(
          players,
          matches,
          league.promotionSlots,
          league.relegationSlots,
          matches.length,
        ),
        matches: matchViews,
      }
    }),
  }
}
