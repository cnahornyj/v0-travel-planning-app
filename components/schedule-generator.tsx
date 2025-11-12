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
import { Clock, Star, Route, Edit2, Car, MapIcon, Footprints } from "lucide-react"
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

const TRAVEL_MODES: TravelMode[] = [
  { mode: "DRIVING", label: "Driving", icon: <Car className="size-4" /> },
  { mode: "WALKING", label: "Walking", icon: <Footprints className="size-4" /> },
  { mode: "TRANSIT", label: "Transit", icon: <MapIcon className="size-4" /> },
]

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
      console.error("Error generating schedule:", error)
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

    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const travelMatrix = await calculateTravelMatrix(trip.places, travelMode)
    const optimizedGroups = optimizePlaceGrouping(trip.places, travelMatrix, totalDays)

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
      let currentTime = 9

      for (let i = 0; i < dayPlaces.length; i++) {
        const place = dayPlaces[i]
        const estimatedDuration = getEstimatedDuration(place.type)

        let travelTime = 0
        if (i > 0) {
          const prevPlace = dayPlaces[i - 1]
          travelTime = getTravelTimeFromMatrix(prevPlace, place, travelMatrix)
        }

        currentTime += travelTime / 60

        const scheduledPlace: ScheduledPlace = {
          ...place,
          scheduledTime: formatTime(currentTime),
          estimatedDuration,
          travelTimeFromPrevious: travelTime,
          day: day + 1,
        }

        daySchedule.places.push(scheduledPlace)
        daySchedule.totalDuration += estimatedDuration + travelTime

        currentTime += estimatedDuration / 60
      }

      if (daySchedule.places.length > 0) {
        schedules.push(daySchedule)
      }
    }

    return schedules
  }

  const calculateTravelMatrix = async (
    places: Place[],
    travelMode: "DRIVING" | "WALKING" | "TRANSIT",
  ): Promise<Map<string, number>> => {
    if (!window.google || !window.google.maps) {
      return new Map()
    }

    const matrix = new Map<string, number>()
    const service = new window.google.maps.DistanceMatrixService()

    const origins = places.map((p) => new window.google.maps.LatLng(p.lat, p.lng))
    const destinations = places.map((p) => new window.google.maps.LatLng(p.lat, p.lng))

    return new Promise((resolve) => {
      service.getDistanceMatrix(
        {
          origins,
          destinations,
          travelMode: window.google.maps.TravelMode[travelMode],
          unitSystem: window.google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        },
        (response: any, status: string) => {
          if (status === "OK" && response) {
            for (let i = 0; i < places.length; i++) {
              for (let j = 0; j < places.length; j++) {
                if (i !== j) {
                  const element = response.rows[i].elements[j]
                  if (element.status === "OK") {
                    const key = `${places[i].id}-${places[j].id}`
                    matrix.set(key, Math.round(element.duration.value / 60))
                  }
                }
              }
            }
          }
          resolve(matrix)
        },
      )
    })
  }

  const getTravelTimeFromMatrix = (from: Place, to: Place, matrix: Map<string, number>): number => {
    const key = `${from.id}-${to.id}`
    return matrix.get(key) || estimateTravelTime(from, to)
  }

  const estimateTravelTime = (from: Place, to: Place): number => {
    const R = 6371
    const dLat = ((to.lat - from.lat) * Math.PI) / 180
    const dLon = ((to.lng - from.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return Math.round((distance / 40) * 60)
  }

  const optimizePlaceGrouping = (places: Place[], travelMatrix: Map<string, number>, totalDays: number): Place[][] => {
    const placesPerDay = Math.ceil(places.length / totalDays)
    const groups: Place[][] = []

    const sortedPlaces = [...places].sort((a, b) => {
      const preferenceOrder = { morning: 0, afternoon: 1, evening: 2, night: 3, anytime: 4 }
      const aOrder = preferenceOrder[a.visitPreference || "anytime"]
      const bOrder = preferenceOrder[b.visitPreference || "anytime"]
      return aOrder - bOrder
    })

    for (let i = 0; i < totalDays; i++) {
      const start = i * placesPerDay
      const end = Math.min(start + placesPerDay, sortedPlaces.length)
      if (start < sortedPlaces.length) {
        groups.push(sortedPlaces.slice(start, end))
      }
    }

    return groups
  }

  const createOptimalSchedule = (trip: Trip): DaySchedule[] => {
    if (!trip.startDate || !trip.endDate || trip.places.length === 0) {
      return []
    }

    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const placesPerDay = Math.ceil(trip.places.length / totalDays)
    const schedules: DaySchedule[] = []

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + day)

      const daySchedule: DaySchedule = {
        day: day + 1,
        date: currentDate.toISOString().split("T")[0],
        places: [],
        totalDuration: 0,
      }

      const startIndex = day * placesPerDay
      const endIndex = Math.min(startIndex + placesPerDay, trip.places.length)
      const dayPlaces = trip.places.slice(startIndex, endIndex)

      let currentTime = 9

      dayPlaces.forEach((place, index) => {
        const estimatedDuration = getEstimatedDuration(place.type)
        const travelTime = index > 0 ? 30 : 0

        currentTime += travelTime / 60

        const scheduledPlace: ScheduledPlace = {
          ...place,
          scheduledTime: formatTime(currentTime),
          estimatedDuration,
          travelTimeFromPrevious: travelTime,
          day: day + 1,
        }

        daySchedule.places.push(scheduledPlace)
        daySchedule.totalDuration += estimatedDuration + travelTime

        currentTime += estimatedDuration / 60
      })

      if (daySchedule.places.length > 0) {
        schedules.push(daySchedule)
      }
    }

    return schedules
  }

  const getEstimatedDuration = (type?: string): number => {
    const durations: Record<string, number> = {
      restaurant: 90,
      tourist_attraction: 120,
      museum: 150,
      park: 90,
      shopping_mall: 120,
      lodging: 60,
    }
    return durations[type || ""] || 90
  }

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    const period = h >= 12 ? "PM" : "AM"
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`
  }

  const handleSaveSchedule = () => {
    onUpdateTrip(trip.id, { places: generatedSchedule.flatMap((day) => day.places) })
    onClose()
  }

  const handleEditPlace = (dayIndex: number, placeIndex: number) => {
    const place = generatedSchedule[dayIndex].places[placeIndex]
    setEditingPlace({ dayIndex, placeIndex })
    setEditingTime(place.scheduledTime || "")
    setEditingDuration(place.estimatedDuration?.toString() || "")
  }

  const handleSaveEdit = () => {
    if (!editingPlace) return

    const newSchedule = [...generatedSchedule]
    const place = newSchedule[editingPlace.dayIndex].places[editingPlace.placeIndex]
    place.scheduledTime = editingTime
    place.estimatedDuration = Number.parseInt(editingDuration) || 90

    setGeneratedSchedule(newSchedule)
    setEditingPlace(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Schedule for {trip.name}</DialogTitle>
          <DialogDescription>Create an optimized daily itinerary for your trip</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Travel Mode:</span>
            <div className="flex gap-2">
              {TRAVEL_MODES.map((mode) => (
                <Badge
                  key={mode.mode}
                  variant={selectedTravelMode === mode.mode ? "default" : "outline"}
                  className="cursor-pointer gap-2"
                  onClick={() => setSelectedTravelMode(mode.mode)}
                >
                  {mode.icon}
                  {mode.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            {isGenerating ? (
              <Button disabled className="w-full">
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating Schedule...
              </Button>
            ) : (
              <Button onClick={generateSchedule} className="w-full">
                <Route className="mr-2 size-4" />
                Generate Optimal Schedule
              </Button>
            )}
          </div>

          {generatedSchedule.length > 0 && (
            <div className="space-y-4">
              {generatedSchedule.map((daySchedule, dayIndex) => (
                <Card key={daySchedule.day} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Day {daySchedule.day}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(daySchedule.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="mr-1 size-3" />
                      {Math.round(daySchedule.totalDuration / 60)}h {daySchedule.totalDuration % 60}m total
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {daySchedule.places.map((place, placeIndex) => (
                      <div key={place.id}>
                        {place.travelTimeFromPrevious && place.travelTimeFromPrevious > 0 && (
                          <div className="my-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Route className="size-4" />
                            <span>{place.travelTimeFromPrevious} min travel time</span>
                          </div>
                        )}

                        <div className="flex items-start gap-3 rounded-lg border p-3">
                          <div className="flex-shrink-0 text-center">
                            <Clock className="mx-auto mb-1 size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{place.scheduledTime}</span>
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium leading-tight">{place.name}</h4>
                            <p className="text-sm text-muted-foreground">{place.address}</p>

                            <div className="mt-2 flex items-center gap-2">
                              {place.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs">{place.rating}</span>
                                </div>
                              )}

                              <Badge variant="outline" className="text-xs">
                                <Clock className="mr-1 size-3" />
                                {place.estimatedDuration} min
                              </Badge>

                              {place.visitPreference && place.visitPreference !== "anytime" && (
                                <Badge variant="secondary" className="text-xs">
                                  {place.visitPreference}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button variant="ghost" size="icon" onClick={() => handleEditPlace(dayIndex, placeIndex)}>
                            <Edit2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {generatedSchedule.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule}>
              <Route className="mr-2 size-4" />
              Save Schedule
            </Button>
          </DialogFooter>
        )}

        <Dialog open={!!editingPlace} onOpenChange={() => setEditingPlace(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Place Time</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  value={editingTime}
                  onChange={(e) => setEditingTime(e.target.value)}
                  placeholder="e.g., 9:00 AM"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={editingDuration}
                  onChange={(e) => setEditingDuration(e.target.value)}
                  placeholder="90"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPlace(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
