import type { Place } from "@/components/travel-planner"

export type Pace = "relaxed" | "balanced" | "intense"
export type TravelMode = "walking" | "transit" | "driving"
export type PlaceSetting = NonNullable<Place["setting"]>

export interface ScheduleOptions {
  pace: Pace
  dayStart: string
  dayEnd: string
  travelMode: TravelMode
  lunchBreak: boolean
  instructions?: string
  arrival?: TripMoment
  departure?: TripMoment
}

export interface TripMoment {
  date: string
  time: string
}

/** Temps laissé après l'arrivée (trajet, dépôt des bagages) */
export const ARRIVAL_BUFFER = 60
/** Temps réservé avant le départ (trajet vers la gare/l'aéroport) */
export const DEPARTURE_BUFFER = 120

export type WeatherIcon = "sun" | "cloud-sun" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm"

export interface DayWeather {
  date: string
  kind: "forecast" | "trend"
  label: string
  icon: WeatherIcon
  tempMax: number
  tempMin: number
  precipitationProbability: number
  precipitationSum: number
  windMax: number
  /** Probabilité de pluie par moment de la journée (prévisions uniquement) */
  periods?: { morning: number; afternoon: number; evening: number }
}

export interface PlannedStep {
  placeId: string
  startTime: string
  duration: number
  reason: string
  travelMinutes?: number
  adjusted?: boolean
}

export interface PlannedDay {
  date: string
  weather: DayWeather | null
  summary: string
  steps: PlannedStep[]
}

export interface UnplacedPlace {
  placeId: string
  reason: string
}

export type PlaceUpdate = Partial<Pick<Place, "setting" | "openingHours" | "estimatedDuration">>

export interface GeneratedPlan {
  days: PlannedDay[]
  unplaced: UnplacedPlace[]
  placeUpdates: Record<string, PlaceUpdate>
  warnings: string[]
}

export type GenerationStep = "places" | "weather" | "planning"

export type StreamMessage =
  | { type: "step"; step: GenerationStep }
  | { type: "result"; plan: GeneratedPlan }
  | { type: "error"; message: string }

export const LUNCH_START = 12 * 60 + 30
export const LUNCH_END = 14 * 60
