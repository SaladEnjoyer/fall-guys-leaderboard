const dateTime = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return dateTime.format(date)
}

export function formatDiff(value: number) {
  if (value > 0) return `+${value}`
  return String(value)
}

export function lobbyText(
  label: string,
  lobby: { server: string; scoreA: number | null; scoreB: number | null },
) {
  const server = lobby.server || "—"
  if (lobby.scoreA == null || lobby.scoreB == null) return `${label} ${server}`
  return `${label} ${server} ${lobby.scoreA}–${lobby.scoreB}`
}

export function closesLabel(iso: string, now = Date.now()) {
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return ""
  const diff = at - now
  if (diff <= 0) return `Closed ${formatWhen(iso)}`
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days > 1) return `Closes in ${days} days · ${formatWhen(iso)}`
  const hours = Math.max(1, Math.ceil(diff / (60 * 60 * 1000)))
  if (hours >= 24) return `Closes in 1 day · ${formatWhen(iso)}`
  return `Closes in ${hours} hour${hours === 1 ? "" : "s"} · ${formatWhen(iso)}`
}

export function phaseLabel(match: {
  phase: "upcoming" | "active" | "forfeit" | "closed"
  opensAt: string
  deadlineAt: string
  playedAt: string | null
}) {
  if (match.phase === "closed" && match.playedAt) return `Closed ${formatWhen(match.playedAt)}`
  if (match.phase === "active") return closesLabel(match.deadlineAt)
  if (match.phase === "forfeit") return "No score in 3 days"
  return `Opens ${formatWhen(match.opensAt)}`
}

export const ACCENT_STYLES = {
  gold: {
    bar: "bg-[#e2a100]",
    chip: "bg-[#ffe7a3] text-[#6b4e00]",
    soft: "bg-[#fff8e4]",
  },
  violet: {
    bar: "bg-[#7a5af8]",
    chip: "bg-[#e6deff] text-[#3d2c86]",
    soft: "bg-[#f6f3ff]",
  },
  cyan: {
    bar: "bg-[#14b4d6]",
    chip: "bg-[#d7f6ff] text-[#0d5568]",
    soft: "bg-[#f1fbff]",
  },
  pink: {
    bar: "bg-[#f24b96]",
    chip: "bg-[#ffd7ea] text-[#8a2458]",
    soft: "bg-[#fff3f8]",
  },
  lime: {
    bar: "bg-[#7bcf2b]",
    chip: "bg-[#e5f8c8] text-[#3d6210]",
    soft: "bg-[#f6fcec]",
  },
} as const

export const ZONE_LABEL = {
  promotion: "Promotion",
  relegation: "Relegation",
  contested: "Contested",
  mid: "Stays",
  none: "No matches",
} as const
