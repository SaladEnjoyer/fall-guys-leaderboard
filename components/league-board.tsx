"use client"

import { useEffect, useState } from "react"
import { LeagueTable } from "@/components/league-table"
import { ACCENT_STYLES } from "@/lib/format"
import type { Board } from "@/lib/types"
import { cn } from "cn"

export function LeagueBoard() {
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stop = false

    async function load() {
      try {
        const response = await fetch("/api/league", { cache: "no-store" })
        if (!response.ok) throw new Error("bad")
        const data = (await response.json()) as Board
        if (!stop) {
          setBoard(data)
          setError(null)
        }
      } catch {
        if (!stop) setError("No se pudo leer la tabla. Se reintenta sola.")
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), 4000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            En vivo
          </p>
          <h1 className="mt-1 font-heading text-3xl text-[#2b1848] sm:text-4xl">
            Clasificación
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5a86] sm:text-base">
            Victoria 3 puntos, empate 1, derrota 0. Si hay empate a puntos, manda la
            diferencia de rondas y después las rondas a favor. Los puestos de ascenso
            y descenso están marcados, y se pueden cambiar cuando los definas.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="status">
          {error}
        </p>
      ) : null}

      {board ? (
        <>
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
        </>
      ) : (
        <div className="grid gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-3xl bg-white/70 ring-1 ring-[#2b1848]/10"
            />
          ))}
        </div>
      )}
    </div>
  )
}
