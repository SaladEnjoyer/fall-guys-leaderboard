import type { StandingRow, Zone } from "@/lib/types"

export const POINTS_LOBBY = 5

type PlayerRef = { id: string; name: string; server: string }

type LobbyRef = {
  playerAId: string
  playerBId: string
  scoreA: number
  scoreB: number
}

type Stats = {
  playerId: string
  name: string
  server: string
  played: number
  wins: number
  losses: number
  roundsFor: number
  roundsAgainst: number
  roundDiff: number
  points: number
}

function tieKey(row: Stats) {
  return `${row.points}|${row.roundDiff}|${row.roundsFor}`
}

function zoneForRange(
  first: number,
  last: number,
  total: number,
  promotionSlots: number,
  relegationSlots: number,
): Zone {
  const promo = Math.max(0, promotionSlots)
  const releg = Math.max(0, relegationSlots)
  const relegStart = releg > 0 ? total - releg + 1 : total + 1

  let promoOnly = false
  let relegOnly = false
  let both = false
  let mid = false

  for (let position = first; position <= last; position += 1) {
    const inPromo = promo > 0 && position <= promo
    const inReleg = releg > 0 && position >= relegStart
    if (inPromo && inReleg) both = true
    else if (inPromo) promoOnly = true
    else if (inReleg) relegOnly = true
    else mid = true
  }

  const kinds = [promoOnly, relegOnly, both, mid].filter(Boolean).length
  if (both || kinds > 1) return "contested"
  if (promoOnly) return "promotion"
  if (relegOnly) return "relegation"
  return "mid"
}

export function describeZones(promotionSlots: number, relegationSlots: number) {
  const up =
    promotionSlots <= 0
      ? "No promotion"
      : promotionSlots === 1
        ? "1st promotes"
        : `Top ${promotionSlots} promote`
  const down =
    relegationSlots <= 0
      ? "no relegation"
      : relegationSlots === 1
        ? "last place relegates"
        : `bottom ${relegationSlots} relegate`
  return `${up} · ${down}`
}

export function computeStandings(
  players: PlayerRef[],
  lobbies: LobbyRef[],
  promotionSlots: number,
  relegationSlots: number,
  lobbiesPlayed: number,
): StandingRow[] {
  const stats = new Map<string, Stats>()

  for (const player of players) {
    stats.set(player.id, {
      playerId: player.id,
      name: player.name,
      server: player.server,
      played: 0,
      wins: 0,
      losses: 0,
      roundsFor: 0,
      roundsAgainst: 0,
      roundDiff: 0,
      points: 0,
    })
  }

  for (const lobby of lobbies) {
    const home = stats.get(lobby.playerAId)
    const away = stats.get(lobby.playerBId)
    if (!home || !away || home.playerId === away.playerId) continue
    if (lobby.scoreA === lobby.scoreB) continue

    home.played += 1
    away.played += 1
    home.roundsFor += lobby.scoreA
    home.roundsAgainst += lobby.scoreB
    away.roundsFor += lobby.scoreB
    away.roundsAgainst += lobby.scoreA

    if (lobby.scoreA > lobby.scoreB) {
      home.wins += 1
      home.points += POINTS_LOBBY
      away.losses += 1
    } else {
      away.wins += 1
      away.points += POINTS_LOBBY
      home.losses += 1
    }
  }

  const rows = [...stats.values()]
  for (const row of rows) {
    row.roundDiff = row.roundsFor - row.roundsAgainst
  }

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff
    if (b.roundsFor !== a.roundsFor) return b.roundsFor - a.roundsFor
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  })

  const standings: StandingRow[] = []
  let index = 0
  while (index < rows.length) {
    let end = index + 1
    while (end < rows.length && tieKey(rows[end]) === tieKey(rows[index])) {
      end += 1
    }
    const position = index + 1
    const lastPosition = end
    const zone =
      lobbiesPlayed === 0
        ? "none"
        : zoneForRange(
            position,
            lastPosition,
            rows.length,
            promotionSlots,
            relegationSlots,
          )

    for (let cursor = index; cursor < end; cursor += 1) {
      const row = rows[cursor]
      standings.push({ ...row, position, zone })
    }
    index = end
  }

  return standings
}
