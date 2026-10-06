import { LeagueBoard } from "@/components/league-board"
import { SiteHeader } from "@/components/site-header"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <LeagueBoard />
      </main>
    </>
  )
}
