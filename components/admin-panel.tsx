"use client"

import { useEffect, useState, type FormEvent } from "react"
import { LeagueTable } from "@/components/league-table"
import { MatchFormat } from "@/components/match-format"
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
import { serverLabel } from "@/lib/rules"
import type { AdminAction, Board, ServerSetup } from "@/lib/types"
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
        setError("Couldn't load the league.")
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
        setError(body.error ?? "Wrong password.")
        return
      }
      const league = await fetch("/api/league", { cache: "no-store" })
      setBoard((await league.json()) as Board)
      setPassword("")
      setPhase("ready")
    } catch {
      setError("Couldn't sign in. Try again.")
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
        setError("Your session expired. Sign in again.")
        return false
      }
      if (!response.ok) {
        setError(body.error ?? "Couldn't save.")
        return false
      }
      setBoard(body)
      setNotice(success)
      return true
    } catch {
      setError("Couldn't save. Try again.")
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
          <h1 className="font-heading text-3xl text-[#2b1848]">League desk</h1>
          <p className="mt-2 text-sm leading-6 text-[#6d5a86]">
            Anyone can view the table. This password is what lets you add matches,
            players, and the promotion and relegation cuts.
          </p>
          <div className="mt-5 space-y-2">
            <Label htmlFor="password">Password</Label>
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
            {busy ? "Signing in…" : "Sign in"}
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
            Add a result
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5a86]">
            Saving a match recalculates that league on its own: points, round
            difference, and the promotion and relegation zones. The cuts in place
            now are provisional.
          </p>
        </div>
        <Button variant="outline" className="h-10 bg-white" onClick={() => void logout()}>
          Sign out
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
  const [servers, setServers] = useState<ServerSetup>("split")
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
          <h2 className="font-heading text-2xl text-[#2b1848]">Match</h2>
          <div className="mt-3">
            <MatchFormat />
          </div>
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
                  servers,
                },
                "Match saved. The table is already updated.",
              ).then((saved) => {
                if (!saved) return
                setScoreA("0")
                setScoreB("0")
              })
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_5rem] sm:items-end">
              <PlayerField
                label="Home · hosts Lobby 2"
                players={league.players}
                value={playerAValue}
                onChange={setPlayerA}
              />
              <ScoreField id={`${league.id}-score-a`} label="Rounds" value={scoreA} onChange={setScoreA} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_5rem] sm:items-end">
              <PlayerField
                label="Away · hosts L2"
                players={league.players}
                value={playerBValue}
                onChange={setPlayerB}
              />
              <ScoreField id={`${league.id}-score-b`} label="Rounds" value={scoreB} onChange={setScoreB} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ServerChoice
                pressed={servers === "split"}
                title="Split servers"
                detail="L2 on away · Lobby 2 on home"
                onClick={() => setServers("split")}
              />
              <ServerChoice
                pressed={servers === "same"}
                title="Same server"
                detail="Both lobbies on one server"
                onClick={() => setServers("same")}
              />
            </div>
            <Button
              type="submit"
              className="h-11"
              disabled={busy || league.players.length < 2 || !playerAValue || !playerBValue}
            >
              {busy ? "Saving…" : "Save match"}
            </Button>
            {league.players.length < 2 ? (
              <p className="text-sm text-[#6d5a86]">Add at least two players before you can record a match.</p>
            ) : null}
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">Players</h2>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              const next = playerName
              void onAct(
                { type: "add-player", leagueId: league.id, name: next },
                `${next.trim()} joined ${league.name}.`,
              ).then((saved) => {
                if (saved) setPlayerName("")
              })
            }}
          >
            <Label htmlFor={`${league.id}-player`} className="sr-only">
              Player name
            </Label>
            <Input
              id={`${league.id}-player`}
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Name"
              className="h-11"
              maxLength={24}
            />
            <Button type="submit" className="h-11" disabled={busy || !playerName.trim()}>
              Add
            </Button>
          </form>
          {league.players.length === 0 ? (
            <p className="mt-3 text-sm text-[#6d5a86]">Nobody in this league yet.</p>
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
                          "Name updated.",
                        ).then(() => setEditingId(null))
                      }}
                    >
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="h-10"
                        maxLength={24}
                        aria-label={`New name for ${player.name}`}
                      />
                      <Button type="submit" className="h-10" disabled={busy}>
                        Save
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
                      Rename
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-9"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Removing ${player.name} also deletes their matches. Continue?`,
                          )
                        ) {
                          void onAct(
                            { type: "remove-player", playerId: player.id },
                            `${player.name} left the league.`,
                          )
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">Promotion and relegation</h2>
          <p className="mt-1 text-sm leading-6 text-[#6d5a86]">
            Use 0 if this league has no promotion or no relegation. Change the
            numbers whenever you decide: the public table updates right away. A tie
            right on the cut shows as “contested”.
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
                "Cuts updated.",
              )
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`${league.id}-up`}>Promotion spots</Label>
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
              <Label htmlFor={`${league.id}-down`}>Relegation spots</Label>
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
              Save cuts
            </Button>
          </form>
          <p className="mt-3 text-xs leading-5 text-[#6d5a86]">
            Starting guess: League 1 relegates 2, Leagues 2–4 promote 2 and relegate
            2, League 5 promotes 2.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">League name</h2>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              void onAct(
                { type: "rename-league", leagueId: league.id, name },
                "League renamed.",
              )
            }}
          >
            <Label htmlFor={`${league.id}-name`} className="sr-only">
              League name
            </Label>
            <Input
              id={`${league.id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11"
              maxLength={24}
            />
            <Button type="submit" variant="outline" className="h-11" disabled={busy || !name.trim()}>
              Rename
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
                  `This deletes every match in ${league.name}. Players stay. Continue?`,
                )
              ) {
                void onAct(
                  { type: "reset-matches", leagueId: league.id },
                  `Matches in ${league.name} were reset.`,
                )
              }
            }}
          >
            Reset matches in this league
          </Button>
        </section>
      </div>

      <div className="flex flex-col gap-5">
        <LeagueTable league={league} />
        {league.matches.length > 0 ? (
          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Fix a match</h2>
            <p className="mt-1 text-sm text-[#6d5a86]">
              If a score is wrong, delete it and enter it again. The table adjusts on its own.
            </p>
            <ul className="mt-4 space-y-2">
              {league.matches.map((match) => (
                <li key={match.id} className="flex flex-col gap-2 rounded-2xl bg-[#faf7ff] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">
                    <span className="font-semibold text-[#2b1848]">{match.playerAName}</span>{" "}
                    <span className="text-xs text-[#6d5a86]">home</span>{" "}
                    <span className="font-heading tabular-nums">
                      {match.scoreA}–{match.scoreB}
                    </span>{" "}
                    <span className="font-semibold text-[#2b1848]">{match.playerBName}</span>{" "}
                    <span className="text-xs text-[#6d5a86]">away</span>
                    <span className="mt-1 block text-xs text-[#6d5a86]">
                      {serverLabel(match.servers)} · {formatWhen(match.playedAt)}
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Delete this match?")) {
                        void onAct(
                          { type: "remove-match", matchId: match.id },
                          "Match deleted. The table was recalculated.",
                        )
                      }
                    }}
                  >
                    Delete
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

function ServerChoice({
  pressed,
  title,
  detail,
  onClick,
}: {
  pressed: boolean
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-2xl px-3 py-3 text-left ring-1 transition-colors",
        pressed
          ? "bg-[#2b1848] text-white ring-[#2b1848]"
          : "bg-white text-[#2b1848] ring-[#2b1848]/15 hover:bg-[#faf7ff]",
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className={cn("mt-1 block text-xs", pressed ? "text-white/80" : "text-[#6d5a86]")}>
        {detail}
      </span>
    </button>
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
          <SelectValue placeholder="Choose a player" />
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
