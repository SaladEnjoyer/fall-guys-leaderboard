type ServerSetup = "split" | "same"

export function isServerSetup(value: unknown): value is ServerSetup {
  return value === "split" || value === "same"
}

export function serverLabel(setup: ServerSetup) {
  return setup === "same"
    ? "Same server · both lobbies"
    : "L2 on away · Lobby 2 on home"
}

export function scoreError(scoreA: number, scoreB: number) {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    return "Rounds have to be a whole number from 0 to 30."
  }
  if (scoreA < 0 || scoreB < 0 || scoreA > 30 || scoreB > 30) {
    return "Rounds have to be a whole number from 0 to 30."
  }

  const high = Math.max(scoreA, scoreB)
  const low = Math.min(scoreA, scoreB)
  const margin = high - low

  if (scoreA === scoreB || high < 5 || margin < 2) {
    if (scoreA === scoreB) {
      const target = Math.max(5, scoreA + 2)
      return `Solo mode, FT5, win by 2. ${scoreA}–${scoreB} is not finished. It has to reach ${target}–${scoreA} or ${scoreA}–${target}.`
    }
    const targetHigh = Math.max(5, low + 2)
    const nextA = scoreA < scoreB ? scoreA : targetHigh
    const nextB = scoreA < scoreB ? targetHigh : scoreB
    return `Solo mode, FT5, win by 2. ${scoreA}–${scoreB} is not a win. It has to be ${nextA}–${nextB}.`
  }

  const previousHigh = high - 1
  if (previousHigh >= 5 && previousHigh - low >= 2) {
    return `${scoreA}–${scoreB} is past the finish. Stop when a player first reaches 5 and leads by 2.`
  }

  return null
}
