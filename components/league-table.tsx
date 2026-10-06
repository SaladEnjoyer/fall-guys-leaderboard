import { Badge } from "@/components/ui/badge"
import { ACCENT_STYLES, ZONE_LABEL, closesLabel, formatDiff, formatWhen, lobbyText } from "@/lib/format"
import type { LeagueView, MatchView, Zone } from "@/lib/types"
import { cn } from "cn"

const zoneRow: Record<Zone, string> = {
  promotion: "bg-emerald-50",
  relegation: "bg-rose-50",
  contested: "bg-amber-50",
  mid: "",
  none: "",
}

const zoneBadge: Record<Zone, string> = {
  promotion: "bg-emerald-600 text-white",
  relegation: "bg-rose-600 text-white",
  contested: "bg-amber-500 text-[#3d2a00]",
  mid: "bg-transparent text-[#6d5a86]",
  none: "bg-transparent text-[#6d5a86]",
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function sideClass(match: MatchView, side: "A" | "B") {
  const wins = side === "A" ? match.lobbyWinsA : match.lobbyWinsB
  const other = side === "A" ? match.lobbyWinsB : match.lobbyWinsA
  if (!match.playedAt || wins === other) return "text-[#6d5a86]"
  return wins > other ? "font-bold text-[#2b1848]" : "text-[#6d5a86]"
}

export function LeagueTable({ league }: { league: LeagueView }) {
  const accent = ACCENT_STYLES[league.accent]
  const active = league.matches.filter((match) => match.phase === "active")
  const results = league.matches.filter((match) => match.phase === "closed")
  const playing = new Set(active.flatMap((match) => [match.playerAId, match.playerBId]))
  const byes = active.length > 0 ? league.players.filter((player) => !playing.has(player.id)) : []
  const opponent = new Map<string, string>()
  for (const match of active) {
    opponent.set(match.playerAId, match.playerBName)
    opponent.set(match.playerBId, match.playerAName)
  }
  const nextOpen = league.matches
    .filter((match) => match.phase === "upcoming")
    .map((match) => match.opensAt)
    .sort()[0]
  const roundNumber = active[0]?.round

  return (
    <section id={league.id} className="scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-[0_8px_0_rgba(43,24,72,0.06)] ring-1 ring-[#2b1848]/10">
      <div className={cn("h-2", accent.bar)} />
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <h2 className="font-heading text-2xl text-[#2b1848]">{league.name}</h2>
          <p className="mt-1 text-sm text-[#6d5a86]">{league.zoneSummary}</p>
        </div>
        <p className="text-sm font-medium text-[#6d5a86]">
          {countLabel(league.players.length, "player", "players")} ·{" "}
          {countLabel(results.length, "result", "results")}
        </p>
      </div>

      <div className="border-t border-[#2b1848]/8 bg-[#faf7ff] px-4 py-4 sm:px-5">
        <h3 className="font-heading text-lg text-[#2b1848]">Active matchups</h3>
        {roundNumber ? (
          <p className="mt-1 text-sm text-[#6d5a86]">
            Round {roundNumber}
            {active[0] ? ` · ${closesLabel(active[0].deadlineAt)}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[#6d5a86]">
            {nextOpen ? `Next opponents ${formatWhen(nextOpen)}` : "No matchups out right now."}
          </p>
        )}
        {active.length > 0 || byes.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {active.map((match) => (
              <li key={match.id} className="text-sm">
                <span className="font-semibold text-[#2b1848]">{match.playerAName}</span>
                {match.lobby1.server ? (
                  <span className="text-xs text-[#6d5a86]"> {match.lobby1.server}</span>
                ) : null}
                <span className="text-[#6d5a86]"> vs </span>
                <span className="font-semibold text-[#2b1848]">{match.playerBName}</span>
                {match.lobby2.server ? (
                  <span className="text-xs text-[#6d5a86]"> {match.lobby2.server}</span>
                ) : null}
                <span className="mt-0.5 block text-xs text-[#6d5a86]">
                  {lobbyText("L1", match.lobby1)} · {lobbyText("L2", match.lobby2)}
                </span>
              </li>
            ))}
            {byes.map((player) => (
              <li key={player.id} className="text-sm text-[#6d5a86]">
                <span className="font-semibold text-[#2b1848]">{player.name}</span> has a bye this round
              </li>
            ))}
          </ul>
        ) : null}
        {nextOpen && active.length > 0 ? (
          <p className="mt-3 text-xs text-[#6d5a86]">Next opponents {formatWhen(nextOpen)}.</p>
        ) : null}
      </div>

      {league.players.length === 0 ? (
        <p className="px-4 pb-5 text-sm text-[#6d5a86] sm:px-5">
          This league has no players yet. Add them from League desk.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <caption className="sr-only">
              {league.name} standings. {league.zoneSummary}.
            </caption>
            <thead>
              <tr className="text-left text-xs tracking-wide text-[#6d5a86] uppercase">
                <th className="px-4 py-2 font-semibold sm:px-5">Pos</th>
                <th className="px-2 py-2 font-semibold">Player</th>
                <th className="px-2 py-2 text-center font-semibold" title="Lobbies played">MP</th>
                <th className="px-2 py-2 text-center font-semibold" title="Lobby wins">W</th>
                <th className="px-2 py-2 text-center font-semibold" title="Lobby losses">L</th>
                <th className="px-2 py-2 text-center font-semibold" title="Rounds for">RF</th>
                <th className="px-2 py-2 text-center font-semibold" title="Rounds against">RA</th>
                <th className="px-2 py-2 text-center font-semibold" title="Round difference">RD</th>
                <th className="px-2 py-2 text-center font-semibold">Pts</th>
                <th className="px-4 py-2 font-semibold sm:px-5">Zone</th>
              </tr>
            </thead>
            <tbody>
              {league.standings.map((row) => (
                <tr key={row.playerId} className={cn("border-t border-[#2b1848]/8", zoneRow[row.zone])}>
                  <td className="px-4 py-3 font-heading text-base text-[#2b1848] sm:px-5">
                    {row.position}
                  </td>
                  <td className="px-2 py-3">
                    <span className="font-semibold text-[#2b1848]">{row.name}</span>
                    {row.server ? (
                      <span className="ml-2 text-xs font-medium text-[#6d5a86]">{row.server}</span>
                    ) : null}
                    {opponent.has(row.playerId) ? (
                      <span className="mt-0.5 block text-xs font-medium text-[#6d5a86]">
                        vs {opponent.get(row.playerId)}
                      </span>
                    ) : byes.some((player) => player.id === row.playerId) ? (
                      <span className="mt-0.5 block text-xs font-medium text-[#6d5a86]">Bye this round</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.played}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.wins}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.losses}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.roundsFor}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.roundsAgainst}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{formatDiff(row.roundDiff)}</td>
                  <td className="px-2 py-3 text-center font-heading text-lg tabular-nums text-[#2b1848]">
                    {row.points}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {row.zone === "mid" || row.zone === "none" ? (
                      <span className="text-[#6d5a86]">{ZONE_LABEL[row.zone]}</span>
                    ) : (
                      <Badge className={zoneBadge[row.zone]}>{ZONE_LABEL[row.zone]}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {league.zonesOverlap ? (
        <p className="mx-4 mb-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:mx-5">
          There are more promotion and relegation spots than players. Adjust the cuts so they do not overlap.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 px-4 pb-4 text-xs text-[#6d5a86] sm:px-5">
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Promotion</span>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-900">Contested if they tie on the cut</span>
        <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-800">Relegation</span>
      </div>

      <div className="border-t border-[#2b1848]/8 px-4 py-4 sm:px-5">
        <h3 className="font-heading text-lg text-[#2b1848]">Recent results</h3>
        {results.length === 0 ? (
          <p className="mt-2 text-sm text-[#6d5a86]">No results in this league yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {results.slice(0, 8).map((match) => (
              <li key={match.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <p>
                  <span className={sideClass(match, "A")}>{match.playerAName}</span>
                  {" "}
                  <span className="font-heading text-base text-[#2b1848]">
                    {lobbyText("L1", match.lobby1)} · {lobbyText("L2", match.lobby2)}
                  </span>
                  {" "}
                  <span className={sideClass(match, "B")}>{match.playerBName}</span>
                </p>
                {match.playedAt ? (
                  <time className="text-xs text-[#6d5a86]" dateTime={match.playedAt}>
                    {formatWhen(match.playedAt)}
                  </time>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

    </section>
  )
}
