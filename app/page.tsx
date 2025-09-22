import { TravelPlanner } from "@/components/travel-planner"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <AuthGuard>
        <TravelPlanner />
      </AuthGuard>
    </main>
  )
}
