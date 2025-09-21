"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, MapPin, Star, Calendar, Route, Zap, Edit2, Check, X, Download, Car, MapIcon } from "lucide-react"
import type { Place, Trip } from "./travel-planner"

interface ScheduleGeneratorProps {
  trip: Trip
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void
  isOpen: boolean
  onClose: () => void
}

interface ScheduledPlace extends Place {
  scheduledTime?: string
  estimatedDuration?: number
  travelTimeFromPrevious?: number
  day?: number
}

interface DaySchedule {
  day: number
  date: string
  places: ScheduledPlace[]
  totalDuration: number
}

interface TravelMode {
  mode: "DRIVING" | "WALKING" | "TRANSIT"
  label: string
  icon: React.ReactNode
}

interface DistanceMatrixResult {
  duration: number // in minutes
  distance: number // in meters
  status: string
}

const TRAVEL_MODES: TravelMode[] = [
  { mode: "DRIVING", label: "Driving", icon: <Car className="w-4 h-4" /> },
  { mode: "WALKING", label: "Walking", icon: <MapIcon className="w-4 h-4" /> },
  { mode: "TRANSIT", label: "Transit", icon: <Route className="w-4 h-4" /> },
]

declare global {
  interface Window {
    google: {
      maps: {
        DistanceMatrixService: new () => {
          getDistanceMatrix: (
            request: {
              origins: any[]
              destinations: any[]
              travelMode: any
              unitSystem: any
              avoidHighways: boolean
              avoidTolls: boolean
            },
            callback: (response: any, status: string) => void,
          ) => void
        }
        LatLng: new (lat: number, lng: number) => any
        TravelMode: {
          DRIVING: any
          WALKING: any
          TRANSIT: any
        }
        UnitSystem: {
          METRIC: any
        }
        DistanceMatrixStatus: {
          OK: string
        }
      }
    }
  }
}

export function ScheduleGenerator({ trip, onUpdateTrip, isOpen, onClose }: ScheduleGeneratorProps) {
  const [generatedSchedule, setGeneratedSchedule] = useState<DaySchedule[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingPlace, setEditingPlace] = useState<{ dayIndex: number; placeIndex: number } | null>(null)
  const [editingTime, setEditingTime] = useState("")
  const [editingDuration, setEditingDuration] = useState("")
  const [selectedTravelMode, setSelectedTravelMode] = useState<"DRIVING" | "WALKING" | "TRANSIT">("DRIVING")

  const generateSchedule = async () => {
    setIsGenerating(true)

    try {
      const schedule = await createOptimalScheduleWithDistanceMatrix(trip, selectedTravelMode)
      setGeneratedSchedule(schedule)
    } catch (error) {
      console.error("[v0] Error generating schedule:", error)
      // Fallback to basic schedule generation
      const schedule = createOptimalSchedule(trip)
      setGeneratedSchedule(schedule)
    } finally {
      setIsGenerating(false)
    }
  }

  const createOptimalScheduleWithDistanceMatrix = async (
    trip: Trip,
    travelMode: "DRIVING" | "WALKING" | "TRANSIT",
  ): Promise<DaySchedule[]> => {
    if (!trip.startDate || !trip.endDate || trip.places.length === 0) {
      return []
    }

    console.log("[v0] Starting schedule generation with Distance Matrix API")

    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Get travel times between all places using Distance Matrix API
    const travelMatrix = await calculateTravelMatrix(trip.places, travelMode)
    console.log("[v0] Travel matrix calculated:", travelMatrix)

    // Optimize place grouping using travel times
    const optimizedGroups = optimizePlaceGrouping(trip.places, travelMatrix, totalDays)
    console.log("[v0] Optimized place groups:", optimizedGroups)

    // Create daily schedules with real travel times
    const schedules: DaySchedule[] = []

    for (let day = 0; day < optimizedGroups.length; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + day)

      const daySchedule: DaySchedule = {
        day: day + 1,
        date: currentDate.toISOString().split("T")[0],
        places: [],
        totalDuration: 0,
      }

      const dayPlaces = optimizedGroups[day]
      let currentTime = 9 // Start at 9 AM

      for (let i = 0; i < dayPlaces.length; i++) {
        const place = dayPlaces[i]
        const estimatedDuration = getEstimatedDuration(place.type)

        let travelTime = 0
        if (i > 0) {
          const prevPlace = dayPlaces[i - 1]
          travelTime = getTravelTimeFromMatrix(prevPlace, place, travelMatrix)
        }

        currentTime += travelTime / 60 // Add travel time in hours

        const scheduledPlace: ScheduledPlace = {
          ...place,
          scheduledTime: formatTime(currentTime),
          estimatedDuration,
          travelTimeFromPrevious: travelTime,
          day: day + 1,
        }

        daySchedule.places.push(scheduledPlace)
        daySchedule.totalDuration += estimatedDuration + travelTime

        currentTime += estimatedDuration / 60 // Add visit duration in hours
      }

      if (daySchedule.places.length > 0) {
        schedules.push(daySchedule)
      }
    }

    return schedules
  }

  const calculateTravelMatrix = async (
    places: Place[],
    travelMode: string,
  ): Promise<Map<string, DistanceMatrixResult>> => {
    const matrix = new Map<string, DistanceMatrixResult>()

    if (!window.google || !window.google.maps) {
      throw new Error("Google Maps API not loaded")
    }

    const service = new window.google.maps.DistanceMatrixService()

    // Process places in batches (Distance Matrix API has limits)
    const batchSize = 10
    const origins = places.map((p) => new window.google.maps.LatLng(p.lat, p.lng))
    const destinations = places.map((p) => new window.google.maps.LatLng(p.lat, p.lng))

    for (let i = 0; i < origins.length; i += batchSize) {
      const originBatch = origins.slice(i, i + batchSize)

      for (let j = 0; j < destinations.length; j += batchSize) {
        const destinationBatch = destinations.slice(j, j + batchSize)

        try {
          const result = await new Promise<any>((resolve, reject) => {
            service.getDistanceMatrix(
              {
                origins: originBatch,
                destinations: destinationBatch,
                travelMode: window.google.maps.TravelMode[travelMode as keyof typeof window.google.maps.TravelMode],
                unitSystem: window.google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false,
              },
              (response, status) => {
                if (status === window.google.maps.DistanceMatrixStatus.OK && response) {
                  resolve(response)
                } else {
                  reject(new Error(`Distance Matrix API error: ${status}`))
                }
              },
            )
          })

          // Process the results
          result.rows.forEach((row: any, originIndex: number) => {
            row.elements.forEach((element: any, destIndex: number) => {
              const actualOriginIndex = i + originIndex
              const actualDestIndex = j + destIndex

              if (actualOriginIndex !== actualDestIndex) {
                // Don't store self-distances
                const key = `${places[actualOriginIndex].id}-${places[actualDestIndex].id}`

                if (element.status === "OK" && element.duration && element.distance) {
                  matrix.set(key, {
                    duration: Math.round(element.duration.value / 60), // Convert to minutes
                    distance: element.distance.value,
                    status: element.status,
                  })
                } else {
                  // Fallback to basic calculation if API fails
                  const fallbackTime = getEstimatedTravelTime(places[actualOriginIndex], places[actualDestIndex])
                  matrix.set(key, {
                    duration: fallbackTime,
                    distance: 0,
                    status: "FALLBACK",
                  })
                }
              }
            })
          })
        } catch (error) {
          console.error("[v0] Distance Matrix API batch error:", error)
          // Use fallback for this batch
          for (let oi = 0; oi < originBatch.length; oi++) {
            for (let di = 0; di < destinationBatch.length; di++) {
              const actualOriginIndex = i + oi
              const actualDestIndex = j + di

              if (actualOriginIndex !== actualDestIndex) {
                const key = `${places[actualOriginIndex].id}-${places[actualDestIndex].id}`
                const fallbackTime = getEstimatedTravelTime(places[actualOriginIndex], places[actualDestIndex])
                matrix.set(key, {
                  duration: fallbackTime,
                  distance: 0,
                  status: "FALLBACK",
                })
              }
            }
          }
        }
      }
    }

    return matrix
  }

  const optimizePlaceGrouping = (
    places: Place[],
    travelMatrix: Map<string, DistanceMatrixResult>,
    totalDays: number,
  ): Place[][] => {
    if (places.length <= totalDays) {
      return places.map((place) => [place])
    }

    // Use a greedy clustering algorithm based on travel times
    const groups: Place[][] = []
    const remaining = [...places]
    const maxPlacesPerDay = Math.ceil(places.length / totalDays)

    for (let day = 0; day < totalDays && remaining.length > 0; day++) {
      const dayGroup: Place[] = []

      // Start with the highest-rated unassigned place or first remaining
      let currentPlace = remaining.reduce((best, place) => ((place.rating || 0) > (best.rating || 0) ? place : best))

      dayGroup.push(currentPlace)
      remaining.splice(remaining.indexOf(currentPlace), 1)

      // Add nearby places to the same day
      while (dayGroup.length < maxPlacesPerDay && remaining.length > 0) {
        let bestNext: Place | null = null
        let shortestTime = Number.POSITIVE_INFINITY

        // Find the closest remaining place to any place in current day
        for (const candidate of remaining) {
          for (const dayPlace of dayGroup) {
            const travelTime = getTravelTimeFromMatrix(dayPlace, candidate, travelMatrix)
            if (travelTime < shortestTime) {
              shortestTime = travelTime
              bestNext = candidate
            }
          }
        }

        if (bestNext && shortestTime < 60) {
          // Only add if travel time is reasonable (< 1 hour)
          dayGroup.push(bestNext)
          remaining.splice(remaining.indexOf(bestNext), 1)
          currentPlace = bestNext
        } else {
          break // No more nearby places
        }
      }

      groups.push(dayGroup)
    }

    // Distribute any remaining places
    let groupIndex = 0
    while (remaining.length > 0) {
      groups[groupIndex % groups.length].push(remaining.shift()!)
      groupIndex++
    }

    return groups
  }

  const getTravelTimeFromMatrix = (from: Place, to: Place, matrix: Map<string, DistanceMatrixResult>): number => {
    const key = `${from.id}-${to.id}`
    const result = matrix.get(key)
    return result ? result.duration : getEstimatedTravelTime(from, to)
  }

  const createOptimalSchedule = (trip: Trip): DaySchedule[] => {
    if (!trip.startDate || !trip.endDate || trip.places.length === 0) {
      return []
    }

    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Group places by type for better scheduling
    const placesByType = trip.places.reduce(
      (acc, place) => {
        const type = place.type || "other"
        if (!acc[type]) acc[type] = []
        acc[type].push(place)
        return acc
      },
      {} as Record<string, Place[]>,
    )

    // Create daily schedules
    const schedules: DaySchedule[] = []
    let remainingPlaces = [...trip.places]

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + day)

      const daySchedule: DaySchedule = {
        day: day + 1,
        date: currentDate.toISOString().split("T")[0],
        places: [],
        totalDuration: 0,
      }

      // Distribute places across days (aim for 3-5 places per day)
      const placesPerDay = Math.ceil(remainingPlaces.length / (totalDays - day))
      const maxPlacesPerDay = Math.min(5, placesPerDay)

      // Select places for this day with smart scheduling
      const dayPlaces = selectPlacesForDay(remainingPlaces, maxPlacesPerDay, day === 0)

      // Schedule places throughout the day
      let currentTime = 9 // Start at 9 AM

      dayPlaces.forEach((place, index) => {
        const estimatedDuration = getEstimatedDuration(place.type)
        const travelTime = index > 0 ? getEstimatedTravelTime(dayPlaces[index - 1], place) : 0

        currentTime += travelTime / 60 // Add travel time in hours

        const scheduledPlace: ScheduledPlace = {
          ...place,
          scheduledTime: formatTime(currentTime),
          estimatedDuration,
          travelTimeFromPrevious: travelTime,
          day: day + 1,
        }

        daySchedule.places.push(scheduledPlace)
        daySchedule.totalDuration += estimatedDuration + travelTime

        currentTime += estimatedDuration / 60 // Add visit duration in hours
      })

      // Remove scheduled places from remaining
      remainingPlaces = remainingPlaces.filter((p) => !dayPlaces.some((dp) => dp.id === p.id))

      if (daySchedule.places.length > 0) {
        schedules.push(daySchedule)
      }
    }

    return schedules
  }

  const selectPlacesForDay = (places: Place[], maxPlaces: number, isFirstDay: boolean): Place[] => {
    // Smart selection algorithm
    const selected: Place[] = []
    const available = [...places]

    // Prioritize attractions for first day
    if (isFirstDay) {
      const attractions = available.filter((p) => p.type === "tourist_attraction")
      if (attractions.length > 0) {
        selected.push(attractions[0])
        available.splice(available.indexOf(attractions[0]), 1)
      }
    }

    // Add variety - mix different types
    const typeOrder = ["restaurant", "museum", "park", "shopping_mall", "lodging"]

    for (const type of typeOrder) {
      if (selected.length >= maxPlaces) break
      const typePlace = available.find((p) => p.type === type)
      if (typePlace) {
        selected.push(typePlace)
        available.splice(available.indexOf(typePlace), 1)
      }
    }

    // Fill remaining slots with highest rated places
    const remaining = available.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, maxPlaces - selected.length)

    return [...selected, ...remaining]
  }

  const getEstimatedDuration = (type?: string): number => {
    // Duration in minutes
    const durations = {
      restaurant: 90,
      tourist_attraction: 120,
      museum: 150,
      park: 90,
      shopping_mall: 120,
      lodging: 30,
      default: 60,
    }
    return durations[type as keyof typeof durations] || durations.default
  }

  const getEstimatedTravelTime = (from: Place, to: Place): number => {
    // Simple distance-based travel time estimation (in minutes)
    const distance = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2))
    // Rough conversion: 1 degree ≈ 111km, assume 30km/h average speed in city
    return Math.max(15, Math.round(distance * 111 * 2)) // Minimum 15 minutes
  }

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const startEditingPlace = (dayIndex: number, placeIndex: number) => {
    const place = generatedSchedule[dayIndex].places[placeIndex]
    setEditingPlace({ dayIndex, placeIndex })
    setEditingTime(place.scheduledTime || "")
    setEditingDuration((place.estimatedDuration || 60).toString())
  }

  const saveEditedPlace = () => {
    if (!editingPlace) return

    const { dayIndex, placeIndex } = editingPlace
    const newSchedule = [...generatedSchedule]
    const place = newSchedule[dayIndex].places[placeIndex]

    // Update the place with new values
    place.scheduledTime = editingTime
    place.estimatedDuration = Number.parseInt(editingDuration) || 60

    // Recalculate subsequent times in the same day
    recalculateScheduleTimes(newSchedule, dayIndex, placeIndex + 1)

    setGeneratedSchedule(newSchedule)
    setEditingPlace(null)
  }

  const recalculateScheduleTimes = (schedule: DaySchedule[], dayIndex: number, startPlaceIndex: number) => {
    const daySchedule = schedule[dayIndex]

    for (let i = startPlaceIndex; i < daySchedule.places.length; i++) {
      const currentPlace = daySchedule.places[i]
      const previousPlace = daySchedule.places[i - 1]

      if (previousPlace && previousPlace.scheduledTime && previousPlace.estimatedDuration) {
        // Parse previous place end time
        const [prevHour, prevMin] = previousPlace.scheduledTime.split(":").map(Number)
        const prevEndTime = prevHour + prevMin / 60 + previousPlace.estimatedDuration / 60

        // Add travel time
        const travelTime = currentPlace.travelTimeFromPrevious || 0
        const newStartTime = prevEndTime + travelTime / 60

        currentPlace.scheduledTime = formatTime(newStartTime)
      }
    }

    // Recalculate day total duration
    daySchedule.totalDuration = daySchedule.places.reduce((total, place) => {
      return total + (place.estimatedDuration || 0) + (place.travelTimeFromPrevious || 0)
    }, 0)
  }

  const cancelEditingPlace = () => {
    setEditingPlace(null)
    setEditingTime("")
    setEditingDuration("")
  }

  const exportToCalendar = () => {
    const icsContent = generateICSContent()
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${trip.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_schedule.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateICSContent = (): string => {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Travel Planner//Travel Schedule//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${trip.name} - Travel Schedule`,
      `X-WR-CALDESC:Generated travel itinerary for ${trip.name}`,
    ].join("\r\n")

    generatedSchedule.forEach((daySchedule) => {
      daySchedule.places.forEach((place, index) => {
        if (!place.scheduledTime || !place.estimatedDuration) return

        const [hours, minutes] = place.scheduledTime.split(":").map(Number)
        const startDate = new Date(daySchedule.date)
        startDate.setHours(hours, minutes, 0, 0)

        const endDate = new Date(startDate)
        endDate.setMinutes(endDate.getMinutes() + place.estimatedDuration)

        const formatDateForICS = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        }

        const eventId = `${trip.id}-${place.id}-${daySchedule.day}@travelplanner.app`

        let description = `Visit ${place.name}`
        if (place.notes) {
          description += `\\n\\nNotes: ${place.notes}`
        }
        if (place.rating) {
          description += `\\n\\nRating: ${place.rating}/5 stars`
        }
        description += `\\n\\nDuration: ${place.estimatedDuration} minutes`
        if (place.travelTimeFromPrevious && index > 0) {
          description += `\\nTravel time from previous location: ${place.travelTimeFromPrevious} minutes`
        }

        icsContent +=
          "\r\n" +
          [
            "BEGIN:VEVENT",
            `UID:${eventId}`,
            `DTSTAMP:${timestamp}`,
            `DTSTART:${formatDateForICS(startDate)}`,
            `DTEND:${formatDateForICS(endDate)}`,
            `SUMMARY:${place.name}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${place.address}`,
            `CATEGORIES:Travel,${place.type || "Place"}`,
            "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "END:VEVENT",
          ].join("\r\n")
      })
    })

    icsContent += "\r\nEND:VCALENDAR"
    return icsContent
  }

  const applySchedule = () => {
    // Convert schedule back to ordered places
    const orderedPlaces = generatedSchedule
      .flatMap((day) => day.places)
      .map(({ scheduledTime, estimatedDuration, travelTimeFromPrevious, day, ...place }) => place)

    onUpdateTrip(trip.id, { places: orderedPlaces })
    onClose()
  }

  const getTotalScheduleTime = () => {
    return generatedSchedule.reduce((total, day) => total + day.totalDuration, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Generate Visit Schedule for {trip.name}
          </DialogTitle>
          <DialogDescription>
            Create an optimized itinerary based on location, opening hours, and real travel times.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedSchedule.length && !isGenerating && (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate Your Schedule</h3>
              <p className="text-muted-foreground mb-4">
                We'll organize your {trip.places.length} places into an optimal visiting order using real travel times
              </p>

              <div className="mb-6">
                <p className="text-sm font-medium mb-3">Select Travel Mode:</p>
                <div className="flex justify-center gap-2">
                  {TRAVEL_MODES.map((mode) => (
                    <Button
                      key={mode.mode}
                      variant={selectedTravelMode === mode.mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTravelMode(mode.mode)}
                      className="gap-2"
                    >
                      {mode.icon}
                      {mode.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={generateSchedule} className="gap-2">
                <Zap className="w-4 h-4" />
                Generate Smart Schedule
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generating Your Schedule...</h3>
              <p className="text-muted-foreground">Calculating real travel times and optimizing visiting order</p>
            </div>
          )}

          {generatedSchedule.length > 0 && (
            <>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-semibold">Schedule Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    {generatedSchedule.length} days • {trip.places.length} places • ~
                    {Math.round(getTotalScheduleTime() / 60)} hours total
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportToCalendar} className="gap-2 bg-transparent">
                    <Download className="w-4 h-4" />
                    Export to Calendar
                  </Button>
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="w-3 h-3" />
                    Optimized
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {generatedSchedule.map((daySchedule, dayIndex) => (
                  <Card key={daySchedule.day} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">Day {daySchedule.day}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(daySchedule.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{daySchedule.places.length} places</p>
                        <p className="text-xs text-muted-foreground">
                          ~{Math.round(daySchedule.totalDuration / 60)}h total
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {daySchedule.places.map((place, placeIndex) => (
                        <div key={place.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                              {placeIndex + 1}
                            </div>
                            {placeIndex < daySchedule.places.length - 1 && <div className="w-px h-8 bg-border mt-2" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium truncate">{place.name}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                                </div>
                                {place.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">{place.rating}</span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right ml-4">
                                {editingPlace?.dayIndex === dayIndex && editingPlace?.placeIndex === placeIndex ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3" />
                                      <Input
                                        type="time"
                                        value={editingTime}
                                        onChange={(e) => setEditingTime(e.target.value)}
                                        className="w-20 h-6 text-xs"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs">Duration:</span>
                                      <Input
                                        type="number"
                                        value={editingDuration}
                                        onChange={(e) => setEditingDuration(e.target.value)}
                                        className="w-16 h-6 text-xs"
                                        min="15"
                                        max="480"
                                      />
                                      <span className="text-xs">min</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={saveEditedPlace}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEditingPlace}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group">
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                      <Clock className="w-3 h-3" />
                                      {place.scheduledTime}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditingPlace(dayIndex, placeIndex)}
                                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{place.estimatedDuration}min visit</p>
                                    {place.travelTimeFromPrevious && place.travelTimeFromPrevious > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{place.travelTimeFromPrevious}min travel
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {generatedSchedule.length > 0 && <Button onClick={applySchedule}>Apply Schedule to Trip</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
