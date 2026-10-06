const bye = ""

export const ROUND_LENGTH_MS = 3 * 24 * 60 * 60 * 1000

export type MatchPhase = "upcoming" | "active" | "forfeit" | "closed"

export function pairKey(left: string, right: string) {
  return left < right ? `${left}\0${right}` : `${right}\0${left}`
}

export function roundRobinRounds(playerIds: readonly string[]): [string, string][][] {
  if (playerIds.length < 2) return []

  const row = [...playerIds]
  if (row.length % 2 === 1) row.push(bye)

  const count = row.length
  const rounds: [string, string][][] = []

  for (let round = 0; round < count - 1; round += 1) {
    const pairs: [string, string][] = []
    for (let index = 0; index < count / 2; index += 1) {
      const left = row[index]
      const right = row[count - 1 - index]
      if (left && right) pairs.push([left, right])
    }
    rounds.push(pairs)

    const fixed = row[0]
    const rest = row.slice(1)
    const moved = rest.pop()
    if (moved !== undefined) rest.unshift(moved)
    row.splice(0, row.length, fixed, ...rest)
  }

  return rounds
}

export function roundRobinPairs(playerIds: readonly string[]): [string, string][] {
  return roundRobinRounds(playerIds).flat()
}

export function missingPairs(
  playerIds: readonly string[],
  existing: readonly { playerAId: string; playerBId: string }[],
) {
  const have = new Set(existing.map((match) => pairKey(match.playerAId, match.playerBId)))
  return roundRobinPairs(playerIds).filter(([left, right]) => !have.has(pairKey(left, right)))
}

export function roundsStillNeeded(
  playerIds: readonly string[],
  existing: readonly { playerAId: string; playerBId: string }[],
) {
  const have = new Set(existing.map((match) => pairKey(match.playerAId, match.playerBId)))
  return roundRobinRounds(playerIds)
    .map((round) => round.filter(([left, right]) => !have.has(pairKey(left, right))))
    .filter((round) => round.length > 0)
}

export function matchPhase(
  match: { playedAt: string | null; opensAt: string; deadlineAt: string },
  now: number,
): MatchPhase {
  if (match.playedAt) return "closed"
  const opens = Date.parse(match.opensAt)
  const deadline = Date.parse(match.deadlineAt)
  if (Number.isFinite(opens) && now < opens) return "upcoming"
  if (Number.isFinite(deadline) && now >= deadline) return "forfeit"
  return "active"
}
