import { TravelPlanner } from "@/components/travel-planner"
import { PasswordGate } from "@/components/password-gate"

export default function Home() {
  return (
    <main>
      <PasswordGate>
        <TravelPlanner />
      </PasswordGate>
    </main>
  )
}
