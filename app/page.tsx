import { HomePage } from "@/components/home-page"
import { PasswordGate } from "@/components/password-gate"

export default function Home() {
  return (
    <PasswordGate>
      <HomePage />
    </PasswordGate>
  )
}
