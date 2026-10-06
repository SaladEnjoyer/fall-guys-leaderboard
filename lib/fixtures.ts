const bye = ""

export function pairKey(left: string, right: string) {
  return left < right ? `${left}\0${right}` : `${right}\0${left}`
}

export function roundRobinPairs(playerIds: readonly string[]): [string, string][] {
  if (playerIds.length < 2) return []

  const row = [...playerIds]
  if (row.length % 2 === 1) row.push(bye)

  const count = row.length
  const pairs: [string, string][] = []

  for (let round = 0; round < count - 1; round += 1) {
    for (let index = 0; index < count / 2; index += 1) {
      const left = row[index]
      const right = row[count - 1 - index]
      if (left && right) pairs.push([left, right])
    }

    const fixed = row[0]
    const rest = row.slice(1)
    const moved = rest.pop()
    if (moved !== undefined) rest.unshift(moved)
    row.splice(0, row.length, fixed, ...rest)
  }

  return pairs
}

export function missingPairs(
  playerIds: readonly string[],
  existing: readonly { playerAId: string; playerBId: string }[],
) {
  const have = new Set(existing.map((match) => pairKey(match.playerAId, match.playerBId)))
  return roundRobinPairs(playerIds).filter(([left, right]) => !have.has(pairKey(left, right)))
}

export function fixtureIsVisible(
  match: { released: boolean; playedAt: string | null; releaseAt: string | null },
  now: number,
) {
  if (match.released || match.playedAt) return true
  if (!match.releaseAt) return false
  const at = Date.parse(match.releaseAt)
  return Number.isFinite(at) && at <= now
}
