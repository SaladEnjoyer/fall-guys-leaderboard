import { LeagueTable } from "@/components/league-table"
import { MatchFormat } from "@/components/match-format"
import { ACCENT_STYLES } from "@/lib/format"
import type { Board } from "@/lib/types"
import { cn } from "cn"

export function StandingsView({ board }: { board: Board }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </p>
        <h1 className="mt-1 font-heading text-3xl text-[#2b1848] sm:text-4xl">Standings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5a86] sm:text-base">
          Win 3 points, loss 0. Tied on points, round difference comes first, then
          rounds won. Promotion and relegation spots are marked, and you can change
          them whenever you decide.
        </p>
      </div>
      <MatchFormat />
      <nav className="sticky top-3 z-20 flex flex-wrap gap-2 rounded-2xl bg-white/90 p-2 shadow-[0_6px_0_rgba(43,24,72,0.05)] ring-1 ring-[#2b1848]/10 backdrop-blur">
        {board.leagues.map((league) => (
          <a
            key={league.id}
            href={`#${league.id}`}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold",
              ACCENT_STYLES[league.accent].chip,
            )}
          >
            {league.name}
          </a>
        ))}
      </nav>
      <div className="flex flex-col gap-6">
        {board.leagues.map((league) => (
          <LeagueTable key={league.id} league={league} />
        ))}
      </div>
    </div>
  )
}
