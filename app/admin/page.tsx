import { AdminPanel } from "@/components/admin-panel"
import { SiteHeader } from "@/components/site-header"

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <AdminPanel />
      </main>
    </>
  )
}
