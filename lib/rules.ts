export function scoreError(scoreA: number, scoreB: number) {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    return "Rounds have to be a whole number from 0 to 30."
  }
  if (scoreA < 0 || scoreB < 0 || scoreA > 30 || scoreB > 30) {
    return "Rounds have to be a whole number from 0 to 30."
  }

  const high = Math.max(scoreA, scoreB)
  const low = Math.min(scoreA, scoreB)

  if (high === 5 && low < 5) return null
  if (high > 5) {
    return `${scoreA}–${scoreB} is past the finish. Stop at 5.`
  }
  return `First to 5. ${scoreA}–${scoreB} is not finished.`
}
