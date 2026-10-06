import { cookies } from "next/headers"
import { AdminDesk } from "@/components/admin-desk"
import { SiteHeader } from "@/components/site-header"
import { ADMIN_COOKIE, verifySession } from "@/lib/auth"
import { readBoard } from "@/lib/store"

export const dynamic = "force-dynamic"

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const jar = await cookies()
  const authed = verifySession(jar.get(ADMIN_COOKIE)?.value)
  const board = authed ? await readBoard() : null

  return (
    <>
      <SiteHeader />
      <main>
        <AdminDesk
          authed={authed}
          board={board}
          leagueId={one(params.league) || "liga-1"}
          error={one(params.error) ?? null}
          notice={one(params.notice) ?? null}
        />
      </main>
    </>
  )
}
