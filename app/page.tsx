import { LiveRefresh } from "@/components/live-refresh"
import { SiteHeader } from "@/components/site-header"
import { StandingsView } from "@/components/standings-view"
import { readBoard } from "@/lib/store"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const board = await readBoard()

  return (
    <>
      <SiteHeader />
      <main>
        <LiveRefresh />
        <StandingsView board={board} />
      </main>
    </>
  )
}
