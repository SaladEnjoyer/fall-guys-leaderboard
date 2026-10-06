import Link from "next/link"
import { LeagueTable } from "@/components/league-table"
import { MatchFormat } from "@/components/match-format"
import { ACCENT_STYLES, lobbyText, phaseLabel } from "@/lib/format"
import type { Board, MatchView } from "@/lib/types"
import { cn } from "cn"

const inputClass =
  "h-11 w-full rounded-lg border border-[#2b1848]/15 bg-white px-3 text-sm text-[#2b1848] outline-none focus:border-[#ff4f9a]"
const buttonClass =
  "inline-flex h-11 items-center justify-center rounded-lg bg-[#ff4f9a] px-4 text-sm font-semibold text-white shadow-[0_3px_0_#c42368] disabled:opacity-40"
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
            Anyone can view the tables. This password is what lets you add players,
            create matchups, and record results.
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
  const missingServer = league.players.filter((player) => !player.server)
  const needsDecision = league.matches.filter((match) => match.phase === "forfeit")
  const active = league.matches.filter((match) => match.phase === "active")
  const upcoming = league.matches.filter((match) => match.phase === "upcoming")
  const closed = league.matches.filter((match) => match.phase === "closed")

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-[#2b1848] sm:text-4xl">League desk</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5a86]">
            Add every player with a name and a server. Creating matchups puts one
            opponent out for each player. You enter the scores and close the match.
            After 3 days, anything still open comes here so you can give someone 5–0, 5–0.
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

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
          <h2 className="font-heading text-2xl text-[#2b1848]">Players</h2>
          <p className="mt-1 text-sm leading-6 text-[#6d5a86]">
            Server is the one they play on, such as EU or NA. Lobby 1 uses the first
            player&apos;s server. Lobby 2 uses the second player&apos;s.
          </p>
          <form method="post" action="/api/admin/form" className="mt-4 grid gap-2 sm:grid-cols-[1fr_7.5rem_auto]">
            <input type="hidden" name="intent" value="add-player" />
            <input type="hidden" name="leagueId" value={league.id} />
            <label className="sr-only" htmlFor={`${league.id}-player`}>Player name</label>
            <input id={`${league.id}-player`} name="name" placeholder="Name" maxLength={24} required className={inputClass} />
            <label className="sr-only" htmlFor={`${league.id}-server`}>Server</label>
            <input id={`${league.id}-server`} name="server" placeholder="EU" maxLength={16} required className={inputClass} />
            <button type="submit" className={buttonClass}>Add</button>
          </form>
          {league.players.length === 0 ? (
            <p className="mt-3 text-sm text-[#6d5a86]">Nobody in this league yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#2b1848]/10">
              {league.players.map((player) => (
                <li key={player.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <form method="post" action="/api/admin/form" className="grid flex-1 gap-2 sm:grid-cols-[1fr_7.5rem_auto]">
                    <input type="hidden" name="intent" value="rename-player" />
                    <input type="hidden" name="leagueId" value={league.id} />
                    <input type="hidden" name="playerId" value={player.id} />
                    <label className="sr-only" htmlFor={`rename-${player.id}`}>Name for {player.name}</label>
                    <input id={`rename-${player.id}`} name="name" defaultValue={player.name} maxLength={24} required className={inputClass} />
                    <label className="sr-only" htmlFor={`server-${player.id}`}>Server for {player.name}</label>
                    <input id={`server-${player.id}`} name="server" defaultValue={player.server} placeholder="EU" maxLength={16} required className={inputClass} />
                    <button type="submit" className={quietButtonClass}>Save</button>
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
          {missingServer.length > 0 ? (
            <p className="mt-3 text-sm text-amber-800">
              Add a server for {missingServer.map((player) => player.name).join(", ")} before creating matchups.
            </p>
          ) : null}
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Matchups</h2>
            <div className="mt-3">
              <MatchFormat />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6d5a86]">
              Builds the whole season. Round 1 goes on the public table now, one matchup
              per player. Each round lasts 3 days. The next pairs appear on their own
              when that time is up. Later rounds stay on this desk until then.
            </p>
            <form method="post" action="/api/admin/form" className="mt-4">
              <input type="hidden" name="intent" value="generate-fixtures" />
              <input type="hidden" name="leagueId" value={league.id} />
              <button type="submit" className={buttonClass} disabled={league.players.length < 2}>
                Create matchups
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
            <h2 className="font-heading text-2xl text-[#2b1848]">Promotion and relegation</h2>
            <p className="mt-1 text-sm leading-6 text-[#6d5a86]">
              Use 0 if this league has no promotion or no relegation. The public table updates as soon as you save.
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
                Reset matchups in this league
              </button>
            </form>
          </section>
        </div>
      </div>

      <LeagueTable league={league} />

      {needsDecision.length > 0 ? (
        <MatchGroup
          title="Needs a decision"
          copy="These had no score after 3 days. They are off the public page. Pick who gets 5–0 in both lobbies, or enter the real scores and close it."
          matches={needsDecision}
          leagueId={league.id}
        />
      ) : null}
      <MatchGroup
        title="This round"
        copy="Enter both lobby scores and close the match. The table updates as soon as you save. Scores are the first player, then the second."
        matches={active}
        leagueId={league.id}
        empty="No matchups are live in this league."
      />
      {upcoming.length > 0 ? (
        <MatchGroup
          title="Later rounds"
          copy="Players cannot see these yet. They go public when the current round hits 3 days."
          matches={upcoming}
          leagueId={league.id}
        />
      ) : null}
      {closed.length > 0 ? (
        <MatchGroup
          title="Closed"
          copy="These are already on the table. Save again if a score needs a fix."
          matches={closed}
          leagueId={league.id}
        />
      ) : null}
    </div>
  )
}

function MatchGroup({
  title,
  copy,
  matches,
  leagueId,
  empty,
}: {
  title: string
  copy: string
  matches: MatchView[]
  leagueId: string
  empty?: string
}) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-[#2b1848]/10">
      <h2 className="font-heading text-2xl text-[#2b1848]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#6d5a86]">{copy}</p>
      {matches.length === 0 ? (
        <p className="mt-4 text-sm text-[#6d5a86]">{empty ?? "None yet."}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {matches.map((match) => (
            <FixtureCard key={match.id} match={match} leagueId={leagueId} />
          ))}
        </ul>
      )}
    </section>
  )
}

function FixtureCard({ match, leagueId }: { match: MatchView; leagueId: string }) {
  const canScore = match.phase !== "upcoming"
  return (
    <li className={cn("rounded-2xl px-4 py-4 ring-1", match.phase === "forfeit" ? "bg-amber-50 ring-amber-200" : match.hidden ? "bg-[#faf7ff] ring-[#2b1848]/10" : "bg-white ring-[#2b1848]/15")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#6d5a86] uppercase">Round {match.round}</p>
          <p className="font-semibold text-[#2b1848]">
            {match.playerAName}
            <span className="font-normal text-[#6d5a86]"> vs </span>
            {match.playerBName}
          </p>
          <p className="mt-1 text-xs text-[#6d5a86]">
            {lobbyText("L1", match.lobby1)} · {lobbyText("L2", match.lobby2)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#6d5a86]">{phaseLabel(match)}</p>
        </div>
        <form method="post" action="/api/admin/form">
          <input type="hidden" name="intent" value="remove-match" />
          <input type="hidden" name="leagueId" value={leagueId} />
          <input type="hidden" name="matchId" value={match.id} />
          <button type="submit" className={quietButtonClass}>Delete</button>
        </form>
      </div>
      {match.phase === "forfeit" ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <ForfeitButton leagueId={leagueId} matchId={match.id} winnerId={match.playerAId} label={`${match.playerAName} gets 5–0, 5–0`} />
          <ForfeitButton leagueId={leagueId} matchId={match.id} winnerId={match.playerBId} label={`${match.playerBName} gets 5–0, 5–0`} />
        </div>
      ) : null}
      {canScore ? (
        <form method="post" action="/api/admin/form" className="mt-4 grid gap-3">
          <input type="hidden" name="intent" value="record-result" />
          <input type="hidden" name="leagueId" value={leagueId} />
          <input type="hidden" name="matchId" value={match.id} />
          <LobbyFields
            idPrefix={match.id}
            label="Lobby 1"
            serverName="lobby1Server"
            scoreAName="lobby1ScoreA"
            scoreBName="lobby1ScoreB"
            server={match.lobby1.server}
            scoreA={match.lobby1.scoreA}
            scoreB={match.lobby1.scoreB}
            playerA={match.playerAName}
            playerB={match.playerBName}
          />
          <LobbyFields
            idPrefix={match.id}
            label="Lobby 2"
            serverName="lobby2Server"
            scoreAName="lobby2ScoreA"
            scoreBName="lobby2ScoreB"
            server={match.lobby2.server}
            scoreA={match.lobby2.scoreA}
            scoreB={match.lobby2.scoreB}
            playerA={match.playerAName}
            playerB={match.playerBName}
          />
          <button type="submit" className={cn(buttonClass, "sm:w-fit")}>Save and close</button>
        </form>
      ) : null}
    </li>
  )
}

function ForfeitButton({
  leagueId,
  matchId,
  winnerId,
  label,
}: {
  leagueId: string
  matchId: string
  winnerId: string
  label: string
}) {
  return (
    <form method="post" action="/api/admin/form">
      <input type="hidden" name="intent" value="award-forfeit" />
      <input type="hidden" name="leagueId" value={leagueId} />
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="winnerId" value={winnerId} />
      <button type="submit" className={buttonClass}>{label}</button>
    </form>
  )
}

function LobbyFields({
  idPrefix,
  label,
  serverName,
  scoreAName,
  scoreBName,
  server,
  scoreA,
  scoreB,
  playerA,
  playerB,
}: {
  idPrefix: string
  label: string
  serverName: string
  scoreAName: string
  scoreBName: string
  server: string
  scoreA: number | null
  scoreB: number | null
  playerA: string
  playerB: string
}) {
  const id = `${idPrefix}-${serverName}`
  return (
    <fieldset className="grid gap-2 sm:grid-cols-[8rem_1fr_auto_1fr] sm:items-end">
      <legend className="mb-1 text-sm font-semibold text-[#2b1848] sm:col-span-4">{label}</legend>
      <label className="space-y-1 text-xs font-medium text-[#6d5a86]" htmlFor={id}>
        Server
        <input id={id} name={serverName} defaultValue={server} maxLength={16} required className={inputClass} />
      </label>
      <label className="space-y-1 text-xs font-medium text-[#6d5a86]">
        {playerA}
        <input name={scoreAName} type="number" min={0} max={30} required defaultValue={scoreA ?? undefined} className={inputClass} />
      </label>
      <span className="hidden pb-2 text-center font-heading text-[#2b1848] sm:block">–</span>
      <label className="space-y-1 text-xs font-medium text-[#6d5a86]">
        {playerB}
        <input name={scoreBName} type="number" min={0} max={30} required defaultValue={scoreB ?? undefined} className={inputClass} />
      </label>
    </fieldset>
  )
}
