import type { Place } from "@/components/travel-planner"

export type CompletableField =
  | "editorialSummary"
  | "openingHours"
  | "estimatedDuration"
  | "price"
  | "website"
  | "photos"

export const FIELD_LABELS: Record<CompletableField, string> = {
  editorialSummary: "Description",
  openingHours: "Horaires",
  estimatedDuration: "Durée de visite",
  price: "Prix",
  website: "Site web",
  photos: "Photos",
}

export function getMissingFields(place: Place): CompletableField[] {
  const missing: CompletableField[] = []
  if (!place.editorialSummary?.trim()) missing.push("editorialSummary")
  const hours = place.openingHours?.weekdayText?.filter((line) => line.replace(/^[^:]+:\s*/, "").trim())
  if (!hours || hours.length === 0) missing.push("openingHours")
  if (!place.estimatedDuration) missing.push("estimatedDuration")
  if (!place.price?.trim()) missing.push("price")
  if (!place.website?.trim()) missing.push("website")
  if (!place.photos || place.photos.length === 0) missing.push("photos")
  return missing
}
