import Link from "next/link"
import { LeagueTable } from "@/components/league-table"
import { MatchFormat } from "@/components/match-format"
import { ACCENT_STYLES, formatWhen } from "@/lib/format"
import { serverLabel } from "@/lib/rules"
import type { Board } from "@/lib/types"
import { cn } from "cn"

const inputClass =
  "h-11 w-full rounded-lg border border-[#2b1848]/15 bg-white px-3 text-sm text-[#2b1848] outline-none focus:border-[#ff4f9a]"
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-lg bg-[#ff4f9a] px-4 text-sm font-semibold text-white shadow-[0_3px_0_#c42368]"
const quietButtonClass =
  "inline-flex h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-[#2b1848] ring-1 ring-[#2b1848]/15"

export function AdminDesk({
  authed,
  board,
  leagueId,
  error,
  notice,
}: {
  authed: boolean
  board: Board | null
  leagueId: string
  error: string | null
  notice: string | null
}) {
  if (!authed || !board) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <form
          method="post"
          action="/api/admin/form"
          className="rounded-3xl bg-white p-6 shadow-[0_8px_0_rgba(43,24,72,0.06)] ring-1 ring-[#2b1848]/10"
        >
          <h1 className="font-heading text-3xl text-[#2b1848]">League desk</h1>
          <p className="mt-2 text-sm leading-6 text-[#6d5a86]">
            Anyone can view the tables. This password is what lets you add matches,
            players, and the promotion and relegation cuts.
          </p>
          <input type="hidden" name="intent" value="login" />
          <label className="mt-5 block space-y-2 text-sm font-medium" htmlFor="password">
            Password
            <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} required />
          </label>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          <button type="submit" className={cn(buttonClass, "mt-5 w-full")}>
            Sign in
          </button>
        </form>
      </div>
    )
  }

  const league = board.leagues.find((item) => item.id === leagueId) ?? board.leagues[0]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-[#2b1848] sm:text-4xl">Add a result</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5a86]">
            Saving a match recalculates that league: points, round difference, and the
            promotion and relegation zones.
          </p>
        </div>
        <form method="post" action="/api/admin/form">
          <input type="hidden" name="intent" value="logout" />
          <button type="submit" className={quietButtonClass}>Sign out</button>
        </form>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>
      ) : null}

      <nav className="flex flex-wrap gap-2">
        {board.leagues.map((item) => (
          <Link
            key={item.id}
            href={`/admin?league=${item.id}`}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold",
              item.id === league.id ? "bg-[#2b1848] text-white" : ACCENT_STYLES[item.accent].chip,
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Match</h2>
            <div className="mt-3">
              <MatchFormat />
            </div>
            {league.players.length < 2 ? (
              <p className="mt-4 text-sm text-[#6d5a86]">Add at least two players before you can record a match.</p>
            ) : (
              <form method="post" action="/api/admin/form" className="mt-4 grid gap-3">
                <input type="hidden" name="intent" value="add-match" />
                <input type="hidden" name="leagueId" value={league.id} />
                <PlayerPick label="Home · hosts Lobby 2" name="playerAId" players={league.players} />
                <label className="space-y-2 text-sm font-medium">
                  Home rounds
                  <input name="scoreA" type="number" min={0} max={30} defaultValue={0} required className={inputClass} />
                </label>
                <PlayerPick label="Away · hosts L2" name="playerBId" players={league.players} />
                <label className="space-y-2 text-sm font-medium">
                  Away rounds
                  <input name="scoreB" type="number" min={0} max={30} defaultValue={0} required className={inputClass} />
                </label>
                <fieldset className="grid gap-2 sm:grid-cols-2">
                  <legend className="sr-only">Servers</legend>
                  <label className="rounded-2xl px-3 py-3 text-sm ring-1 ring-[#2b1848]/15">
                    <input type="radio" name="servers" value="split" defaultChecked className="mr-2" />
                    <span className="font-semibold">Split servers</span>
                    <span className="mt-1 block text-xs text-[#6d5a86]">L2 on away · Lobby 2 on home</span>
                  </label>
                  <label className="rounded-2xl px-3 py-3 text-sm ring-1 ring-[#2b1848]/15">
                    <input type="radio" name="servers" value="same" className="mr-2" />
                    <span className="font-semibold">Same server</span>
                    <span className="mt-1 block text-xs text-[#6d5a86]">Both lobbies on one server</span>
                  </label>
                </fieldset>
                <button type="submit" className={buttonClass}>Save match</button>
              </form>
            )}
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Players</h2>
            <form method="post" action="/api/admin/form" className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="intent" value="add-player" />
              <input type="hidden" name="leagueId" value={league.id} />
              <label className="sr-only" htmlFor={`${league.id}-player`}>Player name</label>
              <input id={`${league.id}-player`} name="name" placeholder="Name" maxLength={24} required className={inputClass} />
              <button type="submit" className={buttonClass}>Add</button>
            </form>
            {league.players.length === 0 ? (
              <p className="mt-3 text-sm text-[#6d5a86]">Nobody in this league yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#2b1848]/10">
                {league.players.map((player) => (
                  <li key={player.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <form method="post" action="/api/admin/form" className="flex flex-1 gap-2">
                      <input type="hidden" name="intent" value="rename-player" />
                      <input type="hidden" name="leagueId" value={league.id} />
                      <input type="hidden" name="playerId" value={player.id} />
                      <label className="sr-only" htmlFor={`rename-${player.id}`}>New name for {player.name}</label>
                      <input id={`rename-${player.id}`} name="name" defaultValue={player.name} maxLength={24} required className={inputClass} />
                      <button type="submit" className={quietButtonClass}>Rename</button>
                    </form>
                    <form method="post" action="/api/admin/form">
                      <input type="hidden" name="intent" value="remove-player" />
                      <input type="hidden" name="leagueId" value={league.id} />
                      <input type="hidden" name="playerId" value={player.id} />
                      <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-rose-50 px-3 text-sm font-semibold text-rose-700">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Promotion and relegation</h2>
            <p className="mt-1 text-sm leading-6 text-[#6d5a86]">
              Use 0 if this league has no promotion or no relegation. The public table
              updates as soon as you save.
            </p>
            <form method="post" action="/api/admin/form" className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="intent" value="update-zones" />
              <input type="hidden" name="leagueId" value={league.id} />
              <label className="space-y-2 text-sm font-medium">
                Promotion spots
                <input name="promotionSlots" type="number" min={0} max={12} defaultValue={league.promotionSlots} required className={inputClass} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Relegation spots
                <input name="relegationSlots" type="number" min={0} max={12} defaultValue={league.relegationSlots} required className={inputClass} />
              </label>
              <button type="submit" className={cn(buttonClass, "sm:col-span-2")}>Save cuts</button>
            </form>
            <p className="mt-3 text-xs leading-5 text-[#6d5a86]">
              Starting guess: League 1 relegates 2, Leagues 2–4 promote 2 and relegate 2, League 5 promotes 2.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">League name</h2>
            <form method="post" action="/api/admin/form" className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="intent" value="rename-league" />
              <input type="hidden" name="leagueId" value={league.id} />
              <label className="sr-only" htmlFor={`${league.id}-name`}>League name</label>
              <input id={`${league.id}-name`} name="name" defaultValue={league.name} maxLength={24} required className={inputClass} />
              <button type="submit" className={quietButtonClass}>Rename</button>
            </form>
            <form method="post" action="/api/admin/form" className="mt-4">
              <input type="hidden" name="intent" value="reset-matches" />
              <input type="hidden" name="leagueId" value={league.id} />
              <button type="submit" disabled={league.matches.length === 0} className="inline-flex h-10 items-center rounded-lg bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-40">
                Reset matches in this league
              </button>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <LeagueTable league={league} />
          {league.matches.length > 0 ? (
            <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
              <h2 className="font-heading text-2xl text-[#2b1848]">Fix a match</h2>
              <p className="mt-1 text-sm text-[#6d5a86]">If a score is wrong, delete it and enter it again.</p>
              <ul className="mt-4 space-y-2">
                {league.matches.map((match) => (
                  <li key={match.id} className="flex flex-col gap-2 rounded-2xl bg-[#faf7ff] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">
                      <span className="font-semibold text-[#2b1848]">{match.playerAName}</span>{" "}
                      <span className="text-xs text-[#6d5a86]">home</span>{" "}
                      <span className="font-heading tabular-nums">{match.scoreA}–{match.scoreB}</span>{" "}
                      <span className="font-semibold text-[#2b1848]">{match.playerBName}</span>{" "}
                      <span className="text-xs text-[#6d5a86]">away</span>
                      <span className="mt-1 block text-xs text-[#6d5a86]">
                        {serverLabel(match.servers)} · {formatWhen(match.playedAt)}
                      </span>
                    </p>
                    <form method="post" action="/api/admin/form">
                      <input type="hidden" name="intent" value="remove-match" />
                      <input type="hidden" name="leagueId" value={league.id} />
                      <input type="hidden" name="matchId" value={match.id} />
                      <button type="submit" className={quietButtonClass}>Delete</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PlayerPick({
  label,
  name,
  players,
}: {
  label: string
  name: string
  players: { id: string; name: string }[]
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      {label}
      <select name={name} required className={inputClass} defaultValue="">
        <option value="" disabled>Choose a player</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>{player.name}</option>
        ))}
      </select>
    </label>
  )
}
