import type { StandingRow, Zone } from "@/lib/types"

export const POINTS_WIN = 3
export const POINTS_DRAW = 1

type PlayerRef = { id: string; name: string }

type MatchRef = {
  playerAId: string
  playerBId: string
  scoreA: number
  scoreB: number
}

type Stats = {
  playerId: string
  name: string
  played: number
  wins: number
  draws: number
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
      ? "Sin ascenso"
      : promotionSlots === 1
        ? "Asciende el 1.º"
        : `Ascienden los ${promotionSlots} primeros`
  const down =
    relegationSlots <= 0
      ? "sin descenso"
      : relegationSlots === 1
        ? "desciende el último"
        : `descienden los ${relegationSlots} últimos`
  return `${up} · ${down}`
}

export function computeStandings(
  players: PlayerRef[],
  matches: MatchRef[],
  promotionSlots: number,
  relegationSlots: number,
  matchesPlayed: number,
): StandingRow[] {
  const stats = new Map<string, Stats>()

  for (const player of players) {
    stats.set(player.id, {
      playerId: player.id,
      name: player.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      roundsFor: 0,
      roundsAgainst: 0,
      roundDiff: 0,
      points: 0,
    })
  }

  for (const match of matches) {
    const home = stats.get(match.playerAId)
    const away = stats.get(match.playerBId)
    if (!home || !away || home.playerId === away.playerId) continue

    home.played += 1
    away.played += 1
    home.roundsFor += match.scoreA
    home.roundsAgainst += match.scoreB
    away.roundsFor += match.scoreB
    away.roundsAgainst += match.scoreA

    if (match.scoreA > match.scoreB) {
      home.wins += 1
      home.points += POINTS_WIN
      away.losses += 1
    } else if (match.scoreA < match.scoreB) {
      away.wins += 1
      away.points += POINTS_WIN
      home.losses += 1
    } else {
      home.draws += 1
      away.draws += 1
      home.points += POINTS_DRAW
      away.points += POINTS_DRAW
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
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" })
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
      matchesPlayed === 0
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
