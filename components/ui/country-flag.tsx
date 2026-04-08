"use client"

import { useState, useEffect } from "react"

interface CountryFlagProps {
  lat: number
  lng: number
  className?: string
}

// Convert country code to flag emoji
function countryCodeToFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function CountryFlag({ lat, lng, className }: CountryFlagProps) {
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const response = await fetch(`/api/country?lat=${lat}&lng=${lng}`)
        if (response.ok) {
          const data = await response.json()
          setCountryCode(data.countryCode)
        }
      } catch (error) {
        console.error("Error fetching country:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountry()
  }, [lat, lng])

  if (isLoading || !countryCode) {
    return null
  }

  return (
    <span className={className} title={countryCode}>
      {countryCodeToFlag(countryCode)}
    </span>
  )
}
