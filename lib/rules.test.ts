import assert from "node:assert/strict"
import test from "node:test"
import { scoreError } from "./rules.ts"

test("first to 5 with a two-round lead is a finished match", () => {
  assert.equal(scoreError(5, 3), null)
  assert.equal(scoreError(0, 5), null)
  assert.equal(scoreError(6, 4), null)
  assert.equal(scoreError(4, 6), null)
  assert.equal(scoreError(7, 5), null)
  assert.equal(scoreError(9, 7), null)
})

test("4-5 has to become 4-6", () => {
  assert.equal(
    scoreError(4, 5),
    "Solo mode, FT5, win by 2. 4–5 is not a win. It has to be 4–6.",
  )
  assert.equal(
    scoreError(5, 4),
    "Solo mode, FT5, win by 2. 5–4 is not a win. It has to be 6–4.",
  )
})

test("a tied score names both ways to close it", () => {
  assert.equal(
    scoreError(4, 4),
    "Solo mode, FT5, win by 2. 4–4 is not finished. It has to reach 6–4 or 4–6.",
  )
  assert.equal(
    scoreError(5, 5),
    "Solo mode, FT5, win by 2. 5–5 is not finished. It has to reach 7–5 or 5–7.",
  )
})

test("a score that continued after the match was over is rejected", () => {
  assert.match(scoreError(6, 3) ?? "", /past the finish/)
  assert.match(scoreError(8, 4) ?? "", /past the finish/)
})
