import { DestinationPage } from "@/components/destination-page"
import { PasswordGate } from "@/components/password-gate"

export default function Destination() {
  return (
    <PasswordGate>
      <DestinationPage />
    </PasswordGate>
  )
}
