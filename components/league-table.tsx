import { Badge } from "@/components/ui/badge"
import { ACCENT_STYLES, ZONE_LABEL, formatDiff, formatWhen } from "@/lib/format"
import type { LeagueView, Zone } from "@/lib/types"
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

export function LeagueTable({ league }: { league: LeagueView }) {
  const accent = ACCENT_STYLES[league.accent]

  return (
    <section id={league.id} className="scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-[0_8px_0_rgba(43,24,72,0.06)] ring-1 ring-[#2b1848]/10">
      <div className={cn("h-2", accent.bar)} />
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <h2 className="font-heading text-2xl text-[#2b1848]">{league.name}</h2>
          <p className="mt-1 text-sm text-[#6d5a86]">{league.zoneSummary}</p>
        </div>
        <p className="text-sm font-medium text-[#6d5a86]">
          {league.players.length} jugadores · {league.matches.length} partidos
        </p>
      </div>

      {league.players.length === 0 ? (
        <p className="px-4 pb-5 text-sm text-[#6d5a86] sm:px-5">
          Esta liga todavía no tiene jugadores. Se agregan desde Cargar partido.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">
              Clasificación de {league.name}. {league.zoneSummary}.
            </caption>
            <thead>
              <tr className="text-left text-xs tracking-wide text-[#6d5a86] uppercase">
                <th className="px-4 py-2 font-semibold sm:px-5">Pos</th>
                <th className="px-2 py-2 font-semibold">Jugador</th>
                <th className="px-2 py-2 text-center font-semibold">PJ</th>
                <th className="px-2 py-2 text-center font-semibold">G</th>
                <th className="px-2 py-2 text-center font-semibold">E</th>
                <th className="px-2 py-2 text-center font-semibold">P</th>
                <th className="px-2 py-2 text-center font-semibold">RF</th>
                <th className="px-2 py-2 text-center font-semibold">RC</th>
                <th className="px-2 py-2 text-center font-semibold">DR</th>
                <th className="px-2 py-2 text-center font-semibold">Pts</th>
                <th className="px-4 py-2 font-semibold sm:px-5">Zona</th>
              </tr>
            </thead>
            <tbody>
              {league.standings.map((row) => (
                <tr key={row.playerId} className={cn("border-t border-[#2b1848]/8", zoneRow[row.zone])}>
                  <td className="px-4 py-3 font-heading text-base text-[#2b1848] sm:px-5">
                    {row.position}
                  </td>
                  <td className="px-2 py-3 font-semibold text-[#2b1848]">{row.name}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.played}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.wins}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{row.draws}</td>
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
          Hay más puestos de ascenso y descenso que jugadores. Ajusta los cortes para que no se pisen.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 px-4 pb-4 text-xs text-[#6d5a86] sm:px-5">
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Ascenso</span>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-900">En disputa si empatan en el corte</span>
        <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-800">Descenso</span>
      </div>

      <div className="border-t border-[#2b1848]/8 px-4 py-4 sm:px-5">
        <h3 className="font-heading text-lg text-[#2b1848]">Últimos partidos</h3>
        {league.matches.length === 0 ? (
          <p className="mt-2 text-sm text-[#6d5a86]">Todavía no hay resultados en esta liga.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {league.matches.slice(0, 8).map((match) => (
              <li key={match.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <p>
                  <span className={match.result === "A" ? "font-bold text-[#2b1848]" : "text-[#6d5a86]"}>
                    {match.playerAName}
                  </span>{" "}
                  <span className="font-heading text-base tabular-nums text-[#2b1848]">
                    {match.scoreA}–{match.scoreB}
                  </span>{" "}
                  <span className={match.result === "B" ? "font-bold text-[#2b1848]" : "text-[#6d5a86]"}>
                    {match.playerBName}
                  </span>
                </p>
                <time className="text-xs text-[#6d5a86]" dateTime={match.playedAt}>
                  {formatWhen(match.playedAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
