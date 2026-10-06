"use client"

import { useEffect, useState, type FormEvent } from "react"
import { LeagueTable } from "@/components/league-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ACCENT_STYLES, formatWhen } from "@/lib/format"
import type { AdminAction, Board } from "@/lib/types"
import { cn } from "cn"

type Phase = "loading" | "locked" | "ready"

export function AdminPanel() {
  const [phase, setPhase] = useState<Phase>("loading")
  const [password, setPassword] = useState("")
  const [board, setBoard] = useState<Board | null>(null)
  const [leagueId, setLeagueId] = useState("liga-1")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let stop = false
    async function load() {
      const session = await fetch("/api/admin/session", { cache: "no-store" })
      const sessionBody = (await session.json()) as { ok: boolean }
      if (stop) return
      if (!sessionBody.ok) {
        setPhase("locked")
        return
      }
      const response = await fetch("/api/league", { cache: "no-store" })
      if (!response.ok) {
        setError("No se pudo leer la liga.")
        setPhase("locked")
        return
      }
      const data = (await response.json()) as Board
      if (stop) return
      setBoard(data)
      setPhase("ready")
    }
    void load()
    return () => {
      stop = true
    }
  }, [])

  async function login(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(body.error ?? "Clave incorrecta.")
        return
      }
      const league = await fetch("/api/league", { cache: "no-store" })
      setBoard((await league.json()) as Board)
      setPassword("")
      setPhase("ready")
    } catch {
      setError("No se pudo entrar. Inténtalo de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    setBoard(null)
    setPhase("locked")
  }

  async function act(action: AdminAction, success: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      })
      const body = (await response.json()) as Board & { error?: string }
      if (response.status === 401) {
        setPhase("locked")
        setError("La sesión caducó. Entra de nuevo.")
        return false
      }
      if (!response.ok) {
        setError(body.error ?? "No se pudo guardar.")
        return false
      }
      setBoard(body)
      setNotice(success)
      return true
    } catch {
      setError("No se pudo guardar. Inténtalo de nuevo.")
      return false
    } finally {
      setBusy(false)
    }
  }

  if (phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-40 animate-pulse rounded-3xl bg-white/80 ring-1 ring-[#2b1848]/10" />
      </div>
    )
  }

  if (phase === "locked") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <form
          onSubmit={login}
          className="rounded-3xl bg-white p-6 shadow-[0_8px_0_rgba(43,24,72,0.06)] ring-1 ring-[#2b1848]/10"
        >
          <h1 className="font-heading text-3xl text-[#2b1848]">Panel de la liga</h1>
          <p className="mt-2 text-sm leading-6 text-[#6d5a86]">
            La tabla la puede ver cualquiera. Solo con esta clave se cargan partidos,
            jugadores y los cortes de ascenso y descenso.
          </p>
          <div className="mt-5 space-y-2">
            <Label htmlFor="password">Clave</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
            />
          </div>
          {error ? (
            <p className="mt-3 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-5 h-11 w-full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    )
  }

  if (!board) return null
  const league = board.leagues.find((item) => item.id === leagueId) ?? board.leagues[0]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-[#2b1848] sm:text-4xl">
            Cargar resultado
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5a86]">
            Al guardar un partido, esa liga se recalcula sola: puntos, diferencia de
            rondas y las zonas de ascenso y descenso. Los cortes de ahora son
            provisionales.
          </p>
        </div>
        <Button variant="outline" className="h-10 bg-white" onClick={() => void logout()}>
          Cerrar sesión
        </Button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      ) : null}

      <Tabs
        value={league.id}
        onValueChange={(value) => {
          setLeagueId(String(value))
          setNotice(null)
          setError(null)
        }}
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-white p-1">
          {board.leagues.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="h-9 px-3">
              {item.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {board.leagues.map((item) => (
          <TabsContent key={item.id} value={item.id} className="mt-4">
            <LeagueEditor
              league={item}
              busy={busy}
              onAct={act}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function LeagueEditor({
  league,
  busy,
  onAct,
}: {
  league: Board["leagues"][number]
  busy: boolean
  onAct: (action: AdminAction, success: string) => Promise<boolean>
}) {
  const accent = ACCENT_STYLES[league.accent]
  const [name, setName] = useState(league.name)
  const [playerName, setPlayerName] = useState("")
  const [playerA, setPlayerA] = useState<string | null>(null)
  const [playerB, setPlayerB] = useState<string | null>(null)
  const [scoreA, setScoreA] = useState("0")
  const [scoreB, setScoreB] = useState("0")
  const [promotion, setPromotion] = useState(String(league.promotionSlots))
  const [relegation, setRelegation] = useState(String(league.relegationSlots))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const playerAValue = league.players.some((player) => player.id === playerA)
    ? playerA
    : null
  const playerBValue = league.players.some((player) => player.id === playerB)
    ? playerB
    : null

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-5">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <div className={cn("mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold", accent.chip)}>
            {league.zoneSummary}
          </div>
          <h2 className="font-heading text-2xl text-[#2b1848]">Partido</h2>
          <p className="mt-1 text-sm text-[#6d5a86]">
            Rondas ganadas por cada jugador. Si empatan el partido, los dos suman 1 punto.
          </p>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!playerAValue || !playerBValue) return
              void onAct(
                {
                  type: "add-match",
                  leagueId: league.id,
                  playerAId: playerAValue,
                  playerBId: playerBValue,
                  scoreA: Number(scoreA),
                  scoreB: Number(scoreB),
                },
                "Partido cargado. La tabla ya está actualizada.",
              ).then((saved) => {
                if (!saved) return
                setScoreA("0")
                setScoreB("0")
              })
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_5rem] sm:items-end">
              <PlayerField
                label="Jugador A"
                players={league.players}
                value={playerAValue}
                onChange={setPlayerA}
              />
              <ScoreField id={`${league.id}-score-a`} label="Rondas" value={scoreA} onChange={setScoreA} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_5rem] sm:items-end">
              <PlayerField
                label="Jugador B"
                players={league.players}
                value={playerBValue}
                onChange={setPlayerB}
              />
              <ScoreField id={`${league.id}-score-b`} label="Rondas" value={scoreB} onChange={setScoreB} />
            </div>
            <Button
              type="submit"
              className="h-11"
              disabled={busy || league.players.length < 2 || !playerAValue || !playerBValue}
            >
              {busy ? "Guardando…" : "Guardar partido"}
            </Button>
            {league.players.length < 2 ? (
              <p className="text-sm text-[#6d5a86]">Agrega al menos dos jugadores para poder cargar un partido.</p>
            ) : null}
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">Jugadores</h2>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              const next = playerName
              void onAct(
                { type: "add-player", leagueId: league.id, name: next },
                `${next.trim()} entra en ${league.name}.`,
              ).then((saved) => {
                if (saved) setPlayerName("")
              })
            }}
          >
            <Label htmlFor={`${league.id}-player`} className="sr-only">
              Nombre del jugador
            </Label>
            <Input
              id={`${league.id}-player`}
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Nombre"
              className="h-11"
              maxLength={24}
            />
            <Button type="submit" className="h-11" disabled={busy || !playerName.trim()}>
              Agregar
            </Button>
          </form>
          {league.players.length === 0 ? (
            <p className="mt-3 text-sm text-[#6d5a86]">Nadie en esta liga todavía.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#2b1848]/8">
              {league.players.map((player) => (
                <li key={player.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  {editingId === player.id ? (
                    <form
                      className="flex flex-1 gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void onAct(
                          { type: "rename-player", playerId: player.id, name: editingName },
                          "Nombre actualizado.",
                        ).then(() => setEditingId(null))
                      }}
                    >
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="h-10"
                        maxLength={24}
                        aria-label={`Nuevo nombre de ${player.name}`}
                      />
                      <Button type="submit" className="h-10" disabled={busy}>
                        Guardar
                      </Button>
                    </form>
                  ) : (
                    <span className="flex-1 font-semibold text-[#2b1848]">{player.name}</span>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9"
                      onClick={() => {
                        setEditingId(player.id)
                        setEditingName(player.name)
                      }}
                    >
                      Renombrar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-9"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Quitar a ${player.name} también borra sus partidos. ¿Seguro?`,
                          )
                        ) {
                          void onAct(
                            { type: "remove-player", playerId: player.id },
                            `${player.name} salió de la liga.`,
                          )
                        }
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">Ascenso y descenso</h2>
          <p className="mt-1 text-sm leading-6 text-[#6d5a86]">
            Pon 0 si esta liga no asciende o no desciende. Cuando lo tengas claro,
            cambia los números: la tabla pública se marca al momento. Un empate justo
            en el corte se muestra como “en disputa”.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              void onAct(
                {
                  type: "update-zones",
                  leagueId: league.id,
                  promotionSlots: Number(promotion),
                  relegationSlots: Number(relegation),
                },
                "Cortes actualizados.",
              )
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`${league.id}-up`}>Puestos de ascenso</Label>
              <Input
                id={`${league.id}-up`}
                type="number"
                min={0}
                max={12}
                value={promotion}
                onChange={(event) => setPromotion(event.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${league.id}-down`}>Puestos de descenso</Label>
              <Input
                id={`${league.id}-down`}
                type="number"
                min={0}
                max={12}
                value={relegation}
                onChange={(event) => setRelegation(event.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 sm:col-span-2" disabled={busy}>
              Guardar cortes
            </Button>
          </form>
          <p className="mt-3 text-xs leading-5 text-[#6d5a86]">
            Provisional de arranque: Liga 1 descienden 2, Ligas 2 y 3 ascienden 2 y
            descienden 2, Liga 4 ascienden 2.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">Nombre de la liga</h2>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              void onAct(
                { type: "rename-league", leagueId: league.id, name },
                "Nombre de la liga actualizado.",
              )
            }}
          >
            <Label htmlFor={`${league.id}-name`} className="sr-only">
              Nombre de la liga
            </Label>
            <Input
              id={`${league.id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11"
              maxLength={24}
            />
            <Button type="submit" variant="outline" className="h-11" disabled={busy || !name.trim()}>
              Renombrar
            </Button>
          </form>
          <Button
            type="button"
            variant="destructive"
            className="mt-4 h-10"
            disabled={busy || league.matches.length === 0}
            onClick={() => {
              if (
                window.confirm(
                  `Se borran los partidos de ${league.name}. Los jugadores se quedan. ¿Seguro?`,
                )
              ) {
                void onAct(
                  { type: "reset-matches", leagueId: league.id },
                  `Partidos de ${league.name} reiniciados.`,
                )
              }
            }}
          >
            Reiniciar partidos de esta liga
          </Button>
        </section>
      </div>

      <div className="flex flex-col gap-5">
        <LeagueTable league={league} />
        {league.matches.length > 0 ? (
          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Corregir un partido</h2>
            <p className="mt-1 text-sm text-[#6d5a86]">
              Si el marcador quedó mal, bórralo y cárgalo otra vez. La tabla se ajusta sola.
            </p>
            <ul className="mt-4 space-y-2">
              {league.matches.map((match) => (
                <li key={match.id} className="flex flex-col gap-2 rounded-2xl bg-[#faf7ff] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">
                    <span className="font-semibold text-[#2b1848]">{match.playerAName}</span>{" "}
                    <span className="font-heading tabular-nums">
                      {match.scoreA}–{match.scoreB}
                    </span>{" "}
                    <span className="font-semibold text-[#2b1848]">{match.playerBName}</span>
                    <span className="mt-1 block text-xs text-[#6d5a86]">{formatWhen(match.playedAt)}</span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("¿Borrar este partido?")) {
                        void onAct(
                          { type: "remove-match", matchId: match.id },
                          "Partido borrado. La tabla se recalculó.",
                        )
                      }
                    }}
                  >
                    Borrar
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function PlayerField({
  label,
  players,
  value,
  onChange,
}: {
  label: string
  players: { id: string; name: string }[]
  value: string | null
  onChange: (value: string | null) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next)}
        disabled={players.length === 0}
      >
        <SelectTrigger className="h-11 w-full">
          <SelectValue placeholder="Elige jugador" />
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              {player.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ScoreField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        max={30}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 text-center font-heading text-lg"
      />
    </div>
  )
}
