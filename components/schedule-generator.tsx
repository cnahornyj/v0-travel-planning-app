"use client"

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
import { Clock, MapPin, Star, Calendar, Route, Zap, Edit2, Check, X, Download } from "lucide-react"
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

export function ScheduleGenerator({ trip, onUpdateTrip, isOpen, onClose }: ScheduleGeneratorProps) {
  const [generatedSchedule, setGeneratedSchedule] = useState<DaySchedule[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingPlace, setEditingPlace] = useState<{ dayIndex: number; placeIndex: number } | null>(null)
  const [editingTime, setEditingTime] = useState("")
  const [editingDuration, setEditingDuration] = useState("")

  const generateSchedule = () => {
    setIsGenerating(true)

    // Simulate processing time
    setTimeout(() => {
      const schedule = createOptimalSchedule(trip)
      setGeneratedSchedule(schedule)
      setIsGenerating(false)
    }, 1500)
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
            Create an optimized itinerary based on location, opening hours, and travel time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedSchedule.length && !isGenerating && (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate Your Schedule</h3>
              <p className="text-muted-foreground mb-4">
                We'll organize your {trip.places.length} places into an optimal visiting order
              </p>
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
              <p className="text-muted-foreground">Analyzing locations, travel times, and optimal visiting order</p>
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
