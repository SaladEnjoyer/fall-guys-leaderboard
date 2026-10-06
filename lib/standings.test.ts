import assert from "node:assert/strict"
import test from "node:test"
import { POINTS_LOBBY, computeStandings, describeZones } from "./standings.ts"

const players = [
  { id: "ana", name: "Ana", server: "EU" },
  { id: "bea", name: "Bea", server: "NA" },
  { id: "cami", name: "Cami", server: "EU" },
  { id: "dario", name: "Darío", server: "SA" },
]

test("a lobby win is 5 points", () => {
  const table = computeStandings(
    players.slice(0, 2),
    [{ playerAId: "ana", playerBId: "bea", scoreA: 5, scoreB: 2 }],
    1,
    1,
    1,
  )

  assert.equal(POINTS_LOBBY, 5)
  assert.equal(table[0].name, "Ana")
  assert.equal(table[0].points, 5)
  assert.equal(table[0].wins, 1)
  assert.equal(table[0].played, 1)
  assert.equal(table[0].roundDiff, 3)
  assert.equal(table[0].zone, "promotion")
  assert.equal(table[1].points, 0)
  assert.equal(table[1].losses, 1)
  assert.equal(table[1].zone, "relegation")
})

test("winning both lobbies is 10 points and 2 wins", () => {
  const table = computeStandings(
    players.slice(0, 2),
    [
      { playerAId: "ana", playerBId: "bea", scoreA: 5, scoreB: 2 },
      { playerAId: "ana", playerBId: "bea", scoreA: 5, scoreB: 1 },
    ],
    1,
    1,
    2,
  )

  assert.equal(table[0].points, 10)
  assert.equal(table[0].wins, 2)
  assert.equal(table[0].played, 2)
  assert.equal(table[0].roundsFor, 10)
  assert.equal(table[0].roundsAgainst, 3)
  assert.equal(table[1].losses, 2)
  assert.equal(table[1].points, 0)
  assert.equal(table[1].played, 2)
})

test("zones stay blank before the first lobby and a tied score adds nothing", () => {
  const idle = computeStandings(players, [], 2, 2, 0)
  assert.equal(idle.every((row) => row.zone === "none" && row.points === 0), true)

  const ignored = computeStandings(
    players.slice(0, 2),
    [{ playerAId: "ana", playerBId: "bea", scoreA: 5, scoreB: 5 }],
    1,
    1,
    0,
  )
  assert.equal(ignored[0].points, 0)
  assert.equal(ignored[0].played, 0)
  assert.equal(ignored[0].wins, 0)
  assert.equal(ignored[1].points, 0)
})

test("round difference breaks a tie, then rounds won", () => {
  const table = computeStandings(
    players.slice(0, 3),
    [
      { playerAId: "ana", playerBId: "bea", scoreA: 5, scoreB: 0 },
      { playerAId: "cami", playerBId: "bea", scoreA: 5, scoreB: 3 },
    ],
    1,
    1,
    2,
  )

  assert.deepEqual(
    table.map((row) => row.name),
    ["Ana", "Cami", "Bea"],
  )
  assert.equal(table[0].points, 5)
  assert.equal(table[1].points, 5)
  assert.equal(table[0].roundDiff, 5)
  assert.equal(table[1].roundDiff, 2)
})

test("a tie exactly on the cut is contested", () => {
  const table = computeStandings(
    players,
    [
      { playerAId: "ana", playerBId: "dario", scoreA: 5, scoreB: 2 },
      { playerAId: "bea", playerBId: "dario", scoreA: 5, scoreB: 2 },
    ],
    1,
    1,
    2,
  )

  const leaders = table.filter((row) => row.name === "Ana" || row.name === "Bea")
  assert.equal(leaders.length, 2)
  assert.equal(leaders.every((row) => row.position === 1), true)
  assert.equal(leaders.every((row) => row.zone === "contested"), true)
  assert.equal(table.find((row) => row.name === "Darío")?.zone, "relegation")
})

test("a tied group that fits inside the zone all promote", () => {
  const table = computeStandings(
    players,
    [
      { playerAId: "ana", playerBId: "cami", scoreA: 5, scoreB: 3 },
      { playerAId: "bea", playerBId: "dario", scoreA: 5, scoreB: 3 },
    ],
    2,
    1,
    2,
  )

  const promoted = table.filter((row) => row.zone === "promotion")
  assert.equal(promoted.length, 2)
  assert.deepEqual(
    promoted.map((row) => row.points),
    [5, 5],
  )
})

test("describeZones names the cuts", () => {
  assert.equal(describeZones(0, 2), "No promotion · bottom 2 relegate")
  assert.equal(describeZones(2, 0), "Top 2 promote · no relegation")
  assert.equal(describeZones(1, 1), "1st promotes · last place relegates")
})
