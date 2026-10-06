import assert from "node:assert/strict"
import test from "node:test"
import { fixtureIsVisible, missingPairs, pairKey, roundRobinPairs } from "./fixtures.ts"

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

test("an odd count uses a bye and still covers everyone", () => {
  const ids = ["a", "b", "c"]
  const pairs = roundRobinPairs(ids)
  assert.equal(pairs.length, 3)
  assert.deepEqual(pairs.map(([left, right]) => pairKey(left, right)).sort(), everyPair(ids))
  assert.equal(roundRobinPairs(["only"]).length, 0)
})

test("pairs that already exist in either order are skipped", () => {
  const created = missingPairs(
    ["a", "b", "c"],
    [{ playerAId: "b", playerBId: "a" }],
  )
  assert.equal(created.length, 2)
  assert.equal(
    created.some(([left, right]) => pairKey(left, right) === pairKey("a", "b")),
    false,
  )
})

test("a matchup stays hidden until it is released, due, or played", () => {
  const now = Date.parse("2026-10-06T15:00:00.000Z")
  const hidden = { released: false, playedAt: null, releaseAt: null }
  assert.equal(fixtureIsVisible(hidden, now), false)
  assert.equal(
    fixtureIsVisible({ ...hidden, releaseAt: "2026-10-06T15:30:00.000Z" }, now),
    false,
  )
  assert.equal(
    fixtureIsVisible({ ...hidden, releaseAt: "2026-10-06T15:00:00.000Z" }, now),
    true,
  )
  assert.equal(fixtureIsVisible({ ...hidden, released: true }, now), true)
  assert.equal(
    fixtureIsVisible({ ...hidden, playedAt: "2026-10-06T14:00:00.000Z" }, now),
    true,
  )
})
