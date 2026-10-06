import assert from "node:assert/strict"
import test from "node:test"
import { scoreError } from "./rules.ts"

test("first to 5 is a finished lobby", () => {
  assert.equal(scoreError(5, 0), null)
  assert.equal(scoreError(5, 3), null)
  assert.equal(scoreError(5, 4), null)
  assert.equal(scoreError(4, 5), null)
  assert.equal(scoreError(0, 5), null)
})

test("a lobby that has not reached 5 is not finished", () => {
  assert.equal(scoreError(4, 4), "First to 5. 4–4 is not finished.")
  assert.equal(scoreError(4, 3), "First to 5. 4–3 is not finished.")
  assert.equal(scoreError(5, 5), "First to 5. 5–5 is not finished.")
})

test("a score that continued after 5 is rejected", () => {
  assert.match(scoreError(6, 4) ?? "", /past the finish/)
  assert.match(scoreError(6, 3) ?? "", /past the finish/)
  assert.match(scoreError(7, 5) ?? "", /past the finish/)
})
