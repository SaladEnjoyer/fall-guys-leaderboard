import assert from "node:assert/strict"
import test from "node:test"
import {
  ROUND_LENGTH_MS,
  matchPhase,
  missingPairs,
  pairKey,
  roundRobinPairs,
  roundRobinRounds,
  roundsStillNeeded,
} from "./fixtures.ts"

function everyPair(ids: string[]) {
  const pairs: string[] = []
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      pairs.push(pairKey(ids[left], ids[right]))
    }
  }
  return pairs.sort()
}

test("four players make every pairing once", () => {
  const ids = ["a", "b", "c", "d"]
  const pairs = roundRobinPairs(ids)
  assert.equal(pairs.length, 6)
  assert.deepEqual(pairs.map(([left, right]) => pairKey(left, right)).sort(), everyPair(ids))
})

test("each round gives every player one opponent", () => {
  const ids = ["a", "b", "c", "d"]
  const rounds = roundRobinRounds(ids)
  assert.equal(rounds.length, 3)
  for (const round of rounds) {
    const players = round.flat()
    assert.equal(players.length, 4)
    assert.equal(new Set(players).size, 4)
  }
})

test("an odd count uses a bye and still covers everyone", () => {
  const ids = ["a", "b", "c"]
  const rounds = roundRobinRounds(ids)
  assert.equal(rounds.length, 3)
  for (const round of rounds) assert.equal(round.length, 1)
  const played = new Map(ids.map((id) => [id, 0]))
  for (const round of rounds) {
    for (const id of round.flat()) played.set(id, (played.get(id) ?? 0) + 1)
  }
  assert.deepEqual([...played.values()], [2, 2, 2])
  assert.equal(roundRobinPairs(["only"]).length, 0)
})

test("pairs that already exist in either order are skipped", () => {
  const created = missingPairs(["a", "b", "c"], [{ playerAId: "b", playerBId: "a" }])
  assert.equal(created.length, 2)
  assert.equal(created.some(([left, right]) => pairKey(left, right) === pairKey("a", "b")), false)

  const rounds = roundsStillNeeded(["a", "b", "c", "d"], [{ playerAId: "a", playerBId: "d" }])
  const flat = rounds.flat()
  assert.equal(flat.length, 5)
  assert.equal(flat.some(([left, right]) => pairKey(left, right) === pairKey("a", "d")), false)
  for (const round of rounds) {
    const players = round.flat()
    assert.equal(new Set(players).size, players.length)
  }
})

test("a round is active for 3 days, then it needs a decision", () => {
  assert.equal(ROUND_LENGTH_MS, 3 * 24 * 60 * 60 * 1000)
  const opensAt = "2026-10-06T12:00:00.000Z"
  const deadlineAt = "2026-10-09T12:00:00.000Z"
  const match = { playedAt: null, opensAt, deadlineAt }
  assert.equal(matchPhase(match, Date.parse("2026-10-06T11:59:00.000Z")), "upcoming")
  assert.equal(matchPhase(match, Date.parse(opensAt)), "active")
  assert.equal(matchPhase(match, Date.parse("2026-10-08T12:00:00.000Z")), "active")
  assert.equal(matchPhase(match, Date.parse(deadlineAt)), "forfeit")
  assert.equal(matchPhase({ ...match, playedAt: opensAt }, Date.parse("2026-10-10T12:00:00.000Z")), "closed")
})
