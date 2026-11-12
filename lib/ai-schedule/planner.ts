import type { Place } from "@/components/travel-planner"
import { distanceKm, getOpenIntervals, isFoodPlace, timeToMinutes, travelMinutes, type Interval } from "./time"
import { outdoorWeatherScore } from "./weather"
import {
  LUNCH_END,
  LUNCH_START,
  type DayWeather,
  type PlannedStep,
  type ScheduleOptions,
  type TravelMode,
  type UnplacedPlace,
} from "./types"

export type PlanningPlace = Pick<
  Place,
  "id" | "name" | "lat" | "lng" | "type" | "tags" | "setting" | "visitPreference" | "openingHours"
> & { duration: number }

export interface DayContext {
  date: string
  window: Interval
  busy: Interval[]
  lunch: Interval | null
  capacity: number
  weather: DayWeather | null
}

const PACE_FACTOR: Record<ScheduleOptions["pace"], number> = {
  relaxed: 0.6,
  balanced: 0.8,
  intense: 1,
}

const SLOT_STEP = 15
const TRAVEL_ALLOWANCE = 20

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}

function overlapLength(a: Interval, b: Interval): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start))
}

export function buildDayContexts(
  dates: string[],
  events: Array<{ date: string; startTime: string; duration: number }>,
  options: ScheduleOptions,
  weather: Map<string, DayWeather>,
): DayContext[] {
  const window = { start: timeToMinutes(options.dayStart), end: timeToMinutes(options.dayEnd) }
  return dates.map((date) => {
    const busy = events
      .filter((event) => event.date === date)
      .map((event) => {
        const start = timeToMinutes(event.startTime)
        return { start, end: start + event.duration }
      })
    const lunch =
      options.lunchBreak && window.start < LUNCH_START && window.end > LUNCH_END
        ? { start: LUNCH_START, end: LUNCH_END }
        : null
    const blocked = [...busy, ...(lunch ? [lunch] : [])]
    const free = window.end - window.start - blocked.reduce((sum, interval) => sum + overlapLength(interval, window), 0)
    return {
      date,
      window,
      busy,
      lunch,
      capacity: Math.max(0, free * PACE_FACTOR[options.pace]),
      weather: weather.get(date) ?? null,
    }
  })
}

const cost = (place: PlanningPlace) => place.duration + TRAVEL_ALLOWANCE

function centroid(places: PlanningPlace[]) {
  return {
    lat: places.reduce((sum, p) => sum + p.lat, 0) / places.length,
    lng: places.reduce((sum, p) => sum + p.lng, 0) / places.length,
  }
}

function kMeans(places: PlanningPlace[], k: number): PlanningPlace[][] {
  const center = centroid(places)
  const seeds = [places.reduce((best, p) => (distanceKm(p, center) < distanceKm(best, center) ? p : best))]
  while (seeds.length < k) {
    const farthest = places.reduce((best, p) => {
      const d = Math.min(...seeds.map((s) => distanceKm(p, s)))
      const bestD = Math.min(...seeds.map((s) => distanceKm(best, s)))
      return d > bestD ? p : best
    })
    seeds.push(farthest)
  }

  let centers = seeds.map((s) => ({ lat: s.lat, lng: s.lng }))
  let groups: PlanningPlace[][] = []
  for (let iteration = 0; iteration < 25; iteration++) {
    groups = centers.map(() => [])
    for (const place of places) {
      let bestIndex = 0
      centers.forEach((c, index) => {
        if (distanceKm(place, c) < distanceKm(place, centers[bestIndex])) bestIndex = index
      })
      groups[bestIndex].push(place)
    }
    const next = groups.map((group, index) => (group.length ? centroid(group) : centers[index]))
    if (next.every((c, i) => c.lat === centers[i].lat && c.lng === centers[i].lng)) break
    centers = next
  }
  return groups.filter((group) => group.length > 0)
}

function openShare(group: PlanningPlace[], date: string): number {
  const known = group
    .map((place) => getOpenIntervals(place, date))
    .filter((intervals): intervals is Interval[] => intervals !== null)
  if (known.length === 0) return 1
  return known.filter((intervals) => intervals.length > 0).length / known.length
}

function outdoorShare(group: PlanningPlace[]): number {
  const weight = (place: PlanningPlace) => (place.setting === "outdoor" ? 1 : place.setting === "mixed" ? 0.5 : 0)
  return group.reduce((sum, place) => sum + weight(place), 0) / group.length
}

/**
 * Groups places by proximity, one group per day, then assigns groups to days
 * considering free time, opening days and weather.
 */
export function assignPlacesToDays(places: PlanningPlace[], days: DayContext[]): Map<string, PlanningPlace[]> {
  const assignment = new Map<string, PlanningPlace[]>(days.map((day) => [day.date, []]))
  const usableDays = days.filter((day) => day.capacity > 0)
  if (places.length === 0 || usableDays.length === 0) return assignment

  const totalCost = places.reduce((sum, place) => sum + cost(place), 0)
  const avgCapacity = usableDays.reduce((sum, day) => sum + day.capacity, 0) / usableDays.length
  const k = Math.max(1, Math.min(Math.ceil(totalCost / Math.max(avgCapacity, 60)), usableDays.length, places.length))
  const maxCapacity = Math.max(...usableDays.map((day) => day.capacity))

  let groups = kMeans(places, k)

  let merged = true
  while (merged && groups.length > 1) {
    merged = false
    const singletonIndex = groups.findIndex((group) => group.length === 1)
    if (singletonIndex < 0) break
    const [single] = groups[singletonIndex]
    const candidates = groups
      .map((group, index) => ({ group, index, distance: distanceKm(single, centroid(group)) }))
      .filter(({ index, group }) => index !== singletonIndex && group.reduce((s, p) => s + cost(p), 0) + cost(single) <= maxCapacity)
      .sort((a, b) => a.distance - b.distance)
    if (candidates.length > 0) {
      candidates[0].group.push(single)
      groups = groups.filter((_, index) => index !== singletonIndex)
      merged = true
    }
  }

  const sortedGroups = [...groups].sort((a, b) => outdoorShare(b) - outdoorShare(a) || b.length - a.length)
  const freeDays = new Set(usableDays.map((day) => day.date))

  for (const group of sortedGroups) {
    const load = group.reduce((sum, place) => sum + cost(place), 0)
    const share = outdoorShare(group)
    let bestDay: DayContext | null = null
    let bestScore = -Infinity
    for (const day of usableDays) {
      if (!freeDays.has(day.date)) continue
      const weather = outdoorWeatherScore(day.weather)
      const score =
        (day.capacity >= load ? 2 : day.capacity / load) +
        openShare(group, day.date) * 1.5 +
        share * weather +
        (1 - share) * (1 - weather) * 0.3
      if (score > bestScore) {
        bestScore = score
        bestDay = day
      }
    }
    if (!bestDay) break
    freeDays.delete(bestDay.date)
    assignment.set(bestDay.date, [...group])
  }

  // Rebalance overloaded days: move the most remote places to the nearest day with room
  const loadOf = (date: string) => (assignment.get(date) ?? []).reduce((sum, place) => sum + cost(place), 0)
  for (const day of usableDays) {
    const list = assignment.get(day.date)!
    while (list.length > 1 && loadOf(day.date) > day.capacity) {
      const center = centroid(list)
      const remote = list.reduce((far, p) => (distanceKm(p, center) > distanceKm(far, center) ? p : far))
      const target = usableDays
        .filter((other) => other.date !== day.date && loadOf(other.date) + cost(remote) <= other.capacity)
        .sort((a, b) => {
          const da = assignment.get(a.date)!.length ? distanceKm(remote, centroid(assignment.get(a.date)!)) : 50
          const db = assignment.get(b.date)!.length ? distanceKm(remote, centroid(assignment.get(b.date)!)) : 50
          return da - db
        })[0]
      if (!target) break
      list.splice(list.indexOf(remote), 1)
      assignment.get(target.date)!.push(remote)
    }
  }

  return assignment
}

interface PlacedStep {
  place: PlanningPlace
  start: number
  end: number
}

function blockedIntervals(day: DayContext, place: PlanningPlace): Interval[] {
  const lunch = day.lunch && !isFoodPlace(place) ? [day.lunch] : []
  return [...day.busy, ...lunch]
}

function fitsAt(
  start: number,
  place: PlanningPlace,
  day: DayContext,
  placed: PlacedStep[],
  mode: TravelMode,
): "ok" | "closed" | "conflict" | "window" {
  const slot = { start, end: start + place.duration }
  if (slot.start < day.window.start || slot.end > day.window.end) return "window"

  const open = getOpenIntervals(place, day.date)
  if (open !== null && !open.some((interval) => slot.start >= interval.start && slot.end <= interval.end)) {
    return "closed"
  }

  if (blockedIntervals(day, place).some((interval) => overlaps(slot, interval))) return "conflict"

  for (const other of placed) {
    const gap = travelMinutes(other.place, place, mode)
    if (overlaps(slot, { start: other.start - gap, end: other.end + gap })) return "conflict"
  }
  return "ok"
}

function findSlot(place: PlanningPlace, day: DayContext, placed: PlacedStep[], mode: TravelMode, from: number) {
  const start = Math.ceil(Math.max(from, day.window.start) / SLOT_STEP) * SLOT_STEP
  for (let t = start; t + place.duration <= day.window.end; t += SLOT_STEP) {
    if (fitsAt(t, place, day, placed, mode) === "ok") return t
  }
  for (let t = Math.ceil(day.window.start / SLOT_STEP) * SLOT_STEP; t < start; t += SLOT_STEP) {
    if (fitsAt(t, place, day, placed, mode) === "ok") return t
  }
  return null
}

function rejectionReason(place: PlanningPlace, day: DayContext): string {
  const open = getOpenIntervals(place, day.date)
  if (open !== null && open.length === 0) return "Fermé ce jour-là"
  if (place.duration > day.window.end - day.window.start) return "Durée de visite trop longue pour la journée"
  return "Pas de créneau libre compatible avec les horaires"
}

export interface ProposedStep {
  placeId: string
  startTime: string
  duration?: number
  reason: string
}

/** Checks the AI proposal against hard constraints and repairs or rejects invalid steps */
export function validateDay(
  day: DayContext,
  proposal: ProposedStep[],
  placesById: Map<string, PlanningPlace>,
  mode: TravelMode,
  alreadyPlanned: Set<string>,
): { steps: PlannedStep[]; rejected: UnplacedPlace[] } {
  const placed: Array<PlacedStep & { reason: string; adjusted: boolean }> = []
  const rejected: UnplacedPlace[] = []

  const ordered = [...proposal].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  for (const step of ordered) {
    const base = placesById.get(step.placeId)
    if (!base || alreadyPlanned.has(base.id)) continue
    const duration =
      step.duration && step.duration >= 15 && step.duration <= 12 * 60 ? Math.round(step.duration / 5) * 5 : base.duration
    const place = { ...base, duration }

    const proposedStart = /^\d{1,2}:\d{2}$/.test(step.startTime) ? timeToMinutes(step.startTime) : day.window.start
    let start: number | null = proposedStart
    let adjusted = false
    if (fitsAt(proposedStart, place, day, placed, mode) !== "ok") {
      start = findSlot(place, day, placed, mode, proposedStart)
      adjusted = start !== null
    }

    if (start === null) {
      rejected.push({ placeId: place.id, reason: rejectionReason(place, day) })
      continue
    }
    alreadyPlanned.add(place.id)
    placed.push({ place, start, end: start + duration, reason: step.reason, adjusted })
  }

  return { steps: finalizeSteps(placed, mode), rejected }
}

/** Deterministic placement used for places the AI skipped, or when the AI is unavailable */
export function placeRemaining(
  day: DayContext,
  existing: PlannedStep[],
  candidates: PlanningPlace[],
  placesById: Map<string, PlanningPlace>,
  mode: TravelMode,
  reason: string,
): { steps: PlannedStep[]; rejected: PlanningPlace[] } {
  const placed: Array<PlacedStep & { reason: string; adjusted: boolean }> = existing.map((step) => {
    const start = timeToMinutes(step.startTime)
    const place = { ...placesById.get(step.placeId)!, duration: step.duration }
    return { place, start, end: start + step.duration, reason: step.reason, adjusted: !!step.adjusted }
  })

  const preferenceStart: Record<string, number> = { morning: 8 * 60, afternoon: 14 * 60, evening: 18 * 60, night: 20 * 60 }
  const remaining = [...candidates].sort(
    (a, b) => (preferenceStart[a.visitPreference ?? ""] ?? 0) - (preferenceStart[b.visitPreference ?? ""] ?? 0),
  )
  const rejected: PlanningPlace[] = []

  while (remaining.length > 0) {
    const last = placed.length ? placed.reduce((latest, step) => (step.end > latest.end ? step : latest)) : null
    remaining.sort((a, b) => (last ? distanceKm(last.place, a) - distanceKm(last.place, b) : 0))
    const place = remaining.shift()!
    const from = Math.max(preferenceStart[place.visitPreference ?? ""] ?? 0, last ? last.end : 0)
    const start = findSlot(place, day, placed, mode, from)
    if (start === null) {
      rejected.push(place)
      continue
    }
    placed.push({ place, start, end: start + place.duration, reason, adjusted: false })
  }

  return { steps: finalizeSteps(placed, mode), rejected }
}

function finalizeSteps(placed: Array<PlacedStep & { reason: string; adjusted: boolean }>, mode: TravelMode): PlannedStep[] {
  const sorted = [...placed].sort((a, b) => a.start - b.start)
  return sorted.map((step, index) => ({
    placeId: step.place.id,
    startTime: `${Math.floor(step.start / 60)
      .toString()
      .padStart(2, "0")}:${(step.start % 60).toString().padStart(2, "0")}`,
    duration: step.place.duration,
    reason: step.reason,
    adjusted: step.adjusted || undefined,
    travelMinutes: index > 0 ? travelMinutes(sorted[index - 1].place, step.place, mode) : undefined,
  }))
}

export { rejectionReason }
