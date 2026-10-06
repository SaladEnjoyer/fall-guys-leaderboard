import assert from "node:assert/strict"
import test from "node:test"
import { computeStandings, describeZones } from "./standings.ts"

const players = [
  { id: "ana", name: "Ana" },
  { id: "bea", name: "Bea" },
  { id: "cami", name: "Cami" },
  { id: "dario", name: "Darío" },
]

test("una victoria suma 3 puntos y cuenta las rondas", () => {
  const table = computeStandings(
    players.slice(0, 2),
    [{ playerAId: "ana", playerBId: "bea", scoreA: 3, scoreB: 1 }],
    1,
    1,
    1,
  )

  assert.equal(table[0].name, "Ana")
  assert.equal(table[0].points, 3)
  assert.equal(table[0].wins, 1)
  assert.equal(table[0].roundDiff, 2)
  assert.equal(table[0].zone, "promotion")
  assert.equal(table[1].points, 0)
  assert.equal(table[1].losses, 1)
  assert.equal(table[1].zone, "relegation")
})

test("el empate reparte 1 punto y no pinta zonas antes del primer partido", () => {
  const idle = computeStandings(players, [], 2, 2, 0)
  assert.equal(idle.every((row) => row.zone === "none" && row.points === 0), true)

  const drawn = computeStandings(
    players.slice(0, 2),
    [{ playerAId: "ana", playerBId: "bea", scoreA: 2, scoreB: 2 }],
    1,
    1,
    1,
  )
  assert.equal(drawn[0].points, 1)
  assert.equal(drawn[1].points, 1)
  assert.equal(drawn[0].draws, 1)
})

test("desempata por diferencia de rondas y luego por rondas a favor", () => {
  const table = computeStandings(
    players.slice(0, 3),
    [
      { playerAId: "ana", playerBId: "bea", scoreA: 3, scoreB: 0 },
      { playerAId: "cami", playerBId: "bea", scoreA: 1, scoreB: 0 },
    ],
    1,
    1,
    2,
  )

  assert.deepEqual(
    table.map((row) => row.name),
    ["Ana", "Cami", "Bea"],
  )
  assert.equal(table[0].points, 3)
  assert.equal(table[1].points, 3)
  assert.equal(table[0].roundDiff, 3)
  assert.equal(table[1].roundDiff, 1)
})

test("un empate sobre el corte queda en disputa", () => {
  const table = computeStandings(
    players,
    [
      { playerAId: "ana", playerBId: "dario", scoreA: 1, scoreB: 0 },
      { playerAId: "bea", playerBId: "dario", scoreA: 1, scoreB: 0 },
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

test("si el grupo empatado cabe entero en la zona, ascienden todos", () => {
  const table = computeStandings(
    players,
    [
      { playerAId: "ana", playerBId: "cami", scoreA: 1, scoreB: 0 },
      { playerAId: "bea", playerBId: "dario", scoreA: 1, scoreB: 0 },
    ],
    2,
    1,
    2,
  )

  const promoted = table.filter((row) => row.zone === "promotion")
  assert.equal(promoted.length, 2)
  assert.deepEqual(
    promoted.map((row) => row.points),
    [3, 3],
  )
})

test("describe los cortes en una frase", () => {
  assert.equal(describeZones(0, 2), "Sin ascenso · descienden los 2 últimos")
  assert.equal(describeZones(2, 0), "Ascienden los 2 primeros · sin descenso")
  assert.equal(describeZones(1, 1), "Asciende el 1.º · desciende el último")
})
