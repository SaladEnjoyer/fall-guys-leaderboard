"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

const links = [
  { href: "/", label: "Tables" },
  { href: "/admin", label: "Add result" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#ff4f9a] shadow-[0_4px_0_#c42368]">
          <Crown />
        </span>
        <span>
          <span className="block font-heading text-xl leading-none text-[#2b1848] sm:text-2xl">
            Fall Guys 1v1 League
          </span>
          <span className="mt-1 block text-sm text-[#6d5a86]">
            Five leagues, one shared scoreboard
          </span>
        </span>
      </Link>
      <nav className="flex gap-2">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
                active
                  ? "bg-[#2b1848] text-white"
                  : "bg-white/80 text-[#2b1848] ring-1 ring-[#2b1848]/10 hover:bg-white",
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

function Crown() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
      <path
        d="M6 22.5 8.2 11l5.2 5.2L16 8l2.6 8.2L23.8 11 26 22.5H6Z"
        fill="#ffe08a"
      />
      <path d="M7 24.5h18v2.2H7z" fill="#fff4c8" />
      <circle cx="8.2" cy="10" r="1.5" fill="#fff" />
      <circle cx="16" cy="7.2" r="1.5" fill="#fff" />
      <circle cx="23.8" cy="10" r="1.5" fill="#fff" />
    </svg>
  )
}
