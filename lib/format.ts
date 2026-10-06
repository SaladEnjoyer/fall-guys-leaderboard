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

export function releaseStatus(match: {
  hidden: boolean
  playedAt: string | null
  releaseAt: string | null
}) {
  if (match.playedAt) return `Played ${formatWhen(match.playedAt)}`
  if (!match.hidden) return "Released"
  if (match.releaseAt) return `Releases ${formatWhen(match.releaseAt)}`
  return "Hidden"
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
