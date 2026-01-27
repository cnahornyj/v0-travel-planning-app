"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import type { Place, ScheduledEvent } from "./travel-planner"
import { cn } from "@/lib/utils"

interface ScheduleSidebarProps {
  isOpen: boolean
  onClose: () => void
  places: Place[]
  scheduledEvents: ScheduledEvent[]
  onAddEvent: (event: Omit<ScheduledEvent, "id">) => void
  onRemoveEvent: (eventId: string) => void
  onOpenEventDialog: (date?: string, placeId?: string, startTime?: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 60 // pixels per hour

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM"
  if (hour === 12) return "12 PM"
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours, 10)
  const suffix = h >= 12 ? "PM" : "AM"
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes} ${suffix}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins}m` : `${hours}h`
}

function getWeekDates(date: Date): Date[] {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

// Check if a time is within opening hours for a place on a given day
function isWithinOpeningHours(
  place: Place,
  date: Date,
  startTime: string,
  duration: number
): { isOpen: boolean; warning?: string } {
  if (!place.openingHours?.periods || place.openingHours.periods.length === 0) {
    return { isOpen: true } // No opening hours data, assume open
  }

  const dayOfWeek = date.getDay()
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration

  // Find periods for this day
  const periodsForDay = place.openingHours.periods.filter(
    (period) => period.open.day === dayOfWeek
  )

  // Get the opening hours text for this day (weekdayText uses Monday=0 indexing sometimes)
  // Try to get the text - Google uses different indexing so we try both
  const dayText = place.openingHours.weekdayText?.[dayOfWeek] || 
                  place.openingHours.weekdayText?.[dayOfWeek === 0 ? 6 : dayOfWeek - 1]

  if (periodsForDay.length === 0) {
    return {
      isOpen: false,
      warning: dayText || `${place.name} appears to be closed on ${date.toLocaleDateString("en-US", { weekday: "long" })}`,
    }
  }

  // Check if the event time falls within any open period
  for (const period of periodsForDay) {
    const openMinutes = timeToMinutes(period.open.time.slice(0, 2) + ":" + period.open.time.slice(2))
    const closeMinutes = period.close
      ? timeToMinutes(period.close.time.slice(0, 2) + ":" + period.close.time.slice(2))
      : 24 * 60 // 24 hours if no close time (open 24h)

    if (startMinutes >= openMinutes && endMinutes <= closeMinutes) {
      return { isOpen: true }
    }
  }

  return {
    isOpen: false,
    warning: dayText
      ? `Outside: ${dayText}`
      : `Event time may be outside opening hours`,
  }
}

// Get opening hours for a place on a specific day
function getOpeningHoursForDay(place: Place, date: Date): { open: number; close: number }[] {
  if (!place.openingHours?.periods) return []

  const dayOfWeek = date.getDay()
  const periodsForDay = place.openingHours.periods.filter(
    (period) => period.open.day === dayOfWeek
  )

  return periodsForDay.map((period) => {
    const openMinutes = timeToMinutes(
      period.open.time.slice(0, 2) + ":" + period.open.time.slice(2)
    )
    const closeMinutes = period.close
      ? timeToMinutes(period.close.time.slice(0, 2) + ":" + period.close.time.slice(2))
      : 24 * 60
    return { open: openMinutes, close: closeMinutes }
  })
}

export function ScheduleSidebar({
  isOpen,
  onClose,
  places,
  scheduledEvents,
  onRemoveEvent,
  onOpenEventDialog,
}: ScheduleSidebarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, (ScheduledEvent & { place: Place })[]>()
    scheduledEvents.forEach((event) => {
      const place = places.find((p) => p.id === event.placeId)
      if (!place) return
      
      const key = event.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ ...event, place })
    })
    return map
  }, [scheduledEvents, places])

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT
    }
  }, [isOpen])

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const dateKey = formatDateKey(date)
    const startTime = `${hour.toString().padStart(2, "0")}:00`
    onOpenEventDialog(dateKey, undefined, startTime)
  }

  const today = new Date()

  const getHeaderText = (): string => {
    const start = weekDates[0]
    const end = weekDates[6]
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
    }
    if (start.getFullYear() === end.getFullYear()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
    }
    return `${monthNames[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
  }

  if (!isOpen) return null

  return (
    <div className="flex h-full w-[700px] flex-col border-l bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-5" />
          <h2 className="font-semibold">Schedule</h2>
          <Badge variant="secondary" className="ml-1">
            {scheduledEvents.length} events
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <Button variant="ghost" size="icon" onClick={navigatePrevious}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{getHeaderText()}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-7 px-2 text-xs"
          >
            Today
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={navigateNext}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="flex shrink-0 border-b">
        {/* Time gutter */}
        <div className="w-14 shrink-0 border-r" />
        {/* Day columns */}
        {weekDates.map((date) => {
          const isToday = isSameDay(date, today)
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          
          return (
            <div
              key={formatDateKey(date)}
              className={cn(
                "flex-1 border-r py-2 text-center last:border-r-0",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {dayNames[date.getDay()]}
              </div>
              <div
                className={cn(
                  "mx-auto mt-1 flex size-7 items-center justify-center rounded-full text-sm font-medium",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time Grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative flex">
          {/* Time gutter */}
          <div className="sticky left-0 z-10 w-14 shrink-0 border-r bg-background">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-b"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date) => {
            const dateKey = formatDateKey(date)
            const dayEvents = eventsByDate.get(dateKey) || []
            const isToday = isSameDay(date, today)

            return (
              <div
                key={dateKey}
                className={cn(
                  "relative flex-1 border-r last:border-r-0",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Hour slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="cursor-pointer border-b transition-colors hover:bg-accent/50"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => handleTimeSlotClick(date, hour)}
                  />
                ))}

                {/* Current time indicator */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 border-t-2 border-red-500"
                    style={{
                      top: (today.getHours() * 60 + today.getMinutes()) * (HOUR_HEIGHT / 60),
                    }}
                  >
                    <div className="absolute -left-1 -top-1.5 size-3 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map((event) => {
                  const startMinutes = timeToMinutes(event.startTime)
                  const top = startMinutes * (HOUR_HEIGHT / 60)
                  const height = Math.max(event.duration * (HOUR_HEIGHT / 60), 24)
                  const isHovered = hoveredEvent === event.id
                  
                  const openingCheck = isWithinOpeningHours(
                    event.place,
                    date,
                    event.startTime,
                    event.duration
                  )

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden rounded border bg-primary/90 px-1.5 py-1 text-primary-foreground shadow-sm transition-all",
                        isHovered && "z-30 ring-2 ring-primary ring-offset-2",
                        !openingCheck.isOpen && "border-amber-400 bg-amber-500/90"
                      )}
                      style={{ top, height }}
                      onMouseEnter={() => setHoveredEvent(event.id)}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            {!openingCheck.isOpen && (
                              <AlertTriangle className="size-3 shrink-0 text-amber-100" />
                            )}
                            <p className="truncate text-xs font-medium">
                              {event.place.name}
                            </p>
                          </div>
                          {height >= 40 && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-90">
                              <Clock className="size-2.5" />
                              <span>
                                {formatTime(event.startTime)} · {formatDuration(event.duration)}
                              </span>
                            </div>
                          )}
                        </div>
                        {isHovered && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 shrink-0 bg-background/20 text-primary-foreground hover:bg-background/40 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveEvent(event.id)
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Warning tooltip on hover */}
                      {isHovered && !openingCheck.isOpen && openingCheck.warning && (
                        <div className="absolute -bottom-12 left-0 right-0 z-40 rounded bg-amber-600 p-1.5 text-[10px] text-white shadow-lg">
                          {openingCheck.warning}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
