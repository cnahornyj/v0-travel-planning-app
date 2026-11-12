import type { Place } from "@/components/travel-planner"
import type { PlaceSetting, TravelMode } from "./types"

export interface Interval {
  start: number
  end: number
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, 24 * 60 - 1))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/** Day of week (0 = Sunday) for a YYYY-MM-DD key, independent of the runtime timezone */
export function dayOfWeek(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay()
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function dateRange(start: string, end: string): string[] {
  const dates: string[] = []
  for (let current = start; current <= end && dates.length < 60; current = addDays(current, 1)) {
    dates.push(current)
  }
  return dates
}

const DAY_NAMES: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function parseClock(hours: string, minutes: string | undefined, meridiem: string | undefined): number {
  let h = Number(hours)
  const m = Number(minutes ?? 0)
  if (meridiem) {
    const isPm = meridiem.toLowerCase().startsWith("p")
    if (isPm && h < 12) h += 12
    if (!isPm && h === 12) h = 0
  }
  return h * 60 + m
}

function parseHoursText(text: string): Interval[] {
  const normalized = text.toLowerCase()
  if (/ferm|closed/.test(normalized)) return []
  if (/24\s*h|24 hours|24\/24/.test(normalized)) return [{ start: 0, end: 24 * 60 }]

  const tokens = [...text.matchAll(/(\d{1,2})(?:[:h.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?/g)]
  const intervals: Interval[] = []
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    const [, sh, sm, smer] = tokens[i]
    const [, eh, em, emer] = tokens[i + 1]
    const end = parseClock(eh, em, emer)
    let start = parseClock(sh, sm, smer ?? emer)
    if (!smer && emer && start > end) start = parseClock(sh, sm, "am")
    intervals.push({ start, end: end <= start ? 24 * 60 : end })
  }
  return intervals
}

/**
 * Opening intervals for a place on a date.
 * Returns null when the hours are unknown, [] when the place is closed.
 */
export function getOpenIntervals(place: Pick<Place, "openingHours">, dateKey: string): Interval[] | null {
  const dow = dayOfWeek(dateKey)
  const periods = place.openingHours?.periods ?? []

  if (periods.length > 0) {
    if (periods.length === 1 && !periods[0].close && periods[0].open.time === "0000") {
      return [{ start: 0, end: 24 * 60 }]
    }
    return periods
      .filter((period) => period.open.day === dow)
      .map((period) => {
        const start = timeToMinutes(`${period.open.time.slice(0, 2)}:${period.open.time.slice(2)}`)
        const sameDayClose = period.close && period.close.day === dow
        const end = sameDayClose
          ? timeToMinutes(`${period.close!.time.slice(0, 2)}:${period.close!.time.slice(2)}`)
          : 24 * 60
        return { start, end: end <= start ? 24 * 60 : end }
      })
  }

  const lines = (place.openingHours?.weekdayText ?? []).filter((line) => line.trim())
  if (lines.length === 0) return null

  const byName = lines.find((line) => {
    const name = line.split(":")[0]?.trim().toLowerCase()
    return DAY_NAMES[name] === dow
  })
  const line = byName ?? (lines.length === 7 ? lines[(dow + 6) % 7] : undefined)
  if (!line) return null

  const content = line.replace(/^[^:]+:\s*/, "")
  if (!content.trim()) return null
  return parseHoursText(content)
}

export function hasKnownHours(place: Pick<Place, "openingHours">): boolean {
  return (
    (place.openingHours?.periods?.length ?? 0) > 0 ||
    (place.openingHours?.weekdayText ?? []).some((line) => line.replace(/^[^:]+:\s*/, "").trim())
  )
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

const TRAVEL_SPEEDS: Record<TravelMode, { kmh: number; overhead: number }> = {
  walking: { kmh: 4.5, overhead: 0 },
  transit: { kmh: 18, overhead: 10 },
  driving: { kmh: 28, overhead: 8 },
}

/** Estimated door-to-door travel time, rounded to 5 minutes */
export function travelMinutes(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  mode: TravelMode,
): number {
  const km = distanceKm(a, b) * 1.3
  if (km < 0.05) return 0
  const { kmh, overhead } = TRAVEL_SPEEDS[mode]
  const minutes = overhead + (km / kmh) * 60
  return Math.max(5, Math.round(minutes / 5) * 5)
}

const OUTDOOR_HINTS = [
  "park",
  "parc",
  "beach",
  "plage",
  "zoo",
  "amusement_park",
  "campground",
  "hiking",
  "randonn",
  "national_park",
  "garden",
  "jardin",
  "natural_feature",
  "nature",
  "plaza",
  "marina",
  "viewpoint",
  "belvédère",
  "lake",
  "lac",
  "mountain",
  "montagne",
  "cascade",
  "waterfall",
]

const INDOOR_HINTS = [
  "museum",
  "musée",
  "musee",
  "art_gallery",
  "gallery",
  "galerie",
  "shopping_mall",
  "aquarium",
  "movie_theater",
  "cinema",
  "cinéma",
  "library",
  "spa",
  "restaurant",
  "cafe",
  "café",
  "bar",
  "night_club",
  "church",
  "église",
  "place_of_worship",
  "cathedral",
  "cathédrale",
  "casino",
  "bowling",
  "store",
  "boutique",
  "theater",
  "théâtre",
]

const MIXED_HINTS = ["market", "marché", "stadium", "stade", "castle", "château", "observation_deck", "amusement"]

export function inferSetting(place: Pick<Place, "type" | "tags" | "name">): PlaceSetting | undefined {
  const haystack = [place.type ?? "", ...(place.tags ?? []), place.name].join(" ").toLowerCase()
  if (MIXED_HINTS.some((hint) => haystack.includes(hint))) return "mixed"
  const outdoor = OUTDOOR_HINTS.some((hint) => haystack.includes(hint))
  const indoor = INDOOR_HINTS.some((hint) => haystack.includes(hint))
  if (outdoor && indoor) return "mixed"
  if (outdoor) return "outdoor"
  if (indoor) return "indoor"
  return undefined
}

export function isFoodPlace(place: Pick<Place, "type" | "tags">): boolean {
  const haystack = [place.type ?? "", ...(place.tags ?? [])].join(" ").toLowerCase()
  return /restaurant|cafe|café|bakery|boulangerie|food|brunch/.test(haystack)
}

export function isLodging(place: Pick<Place, "type" | "tags" | "numberOfNights">): boolean {
  if (place.numberOfNights) return true
  const haystack = [place.type ?? "", ...(place.tags ?? [])].join(" ").toLowerCase()
  return /lodging|hotel|hôtel|hostel|auberge|logement|airbnb/.test(haystack)
}
