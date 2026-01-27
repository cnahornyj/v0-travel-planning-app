"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
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
  onOpenEventDialog: (date?: string, placeId?: string) => void
}

type ViewMode = "week" | "month"

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

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
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
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

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
  
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function ScheduleSidebar({
  isOpen,
  onClose,
  places,
  scheduledEvents,
  onRemoveEvent,
  onOpenEventDialog,
}: ScheduleSidebarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const dates = useMemo(() => {
    return viewMode === "week" ? getWeekDates(currentDate) : getMonthDates(currentDate)
  }, [viewMode, currentDate])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduledEvent[]>()
    scheduledEvents.forEach((event) => {
      const key = event.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    })
    // Sort events by start time
    map.forEach((events) => {
      events.sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return map
  }, [scheduledEvents])

  const getPlaceById = (placeId: string): Place | undefined => {
    return places.find((p) => p.id === placeId)
  }

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleDateDoubleClick = (date: Date) => {
    onOpenEventDialog(formatDateKey(date))
  }

  const getHeaderText = (): string => {
    if (viewMode === "week") {
      const weekDates = getWeekDates(currentDate)
      const start = weekDates[0]
      const end = weekDates[6]
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const today = new Date()

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(formatDateKey(selectedDate)) || []
    : []

  if (!isOpen) return null

  return (
    <div className="flex h-full w-96 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-5" />
          <h2 className="font-semibold">Schedule</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* View Toggle & Navigation */}
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
            className="flex-1"
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            className="flex-1"
          >
            Month
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-medium">{getHeaderText()}</p>
            <Button
              variant="link"
              size="sm"
              onClick={goToToday}
              className="h-auto p-0 text-xs text-muted-foreground"
            >
              Today
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Day Headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date) => {
            const dateKey = formatDateKey(date)
            const events = eventsByDate.get(dateKey) || []
            const isToday = isSameDay(date, today)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()

            return (
              <button
                key={dateKey}
                onClick={() => handleDateClick(date)}
                onDoubleClick={() => handleDateDoubleClick(date)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-start rounded-md p-1 text-sm transition-colors hover:bg-accent",
                  isToday && "bg-primary/10 font-bold",
                  isSelected && "ring-2 ring-primary",
                  !isCurrentMonth && viewMode === "month" && "text-muted-foreground/50"
                )}
              >
                <span className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}>
                  {date.getDate()}
                </span>
                {events.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                    {events.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id}
                        className="size-1.5 rounded-full bg-primary"
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{events.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenEventDialog(formatDateKey(selectedDate))}
              >
                <Plus className="mr-1 size-3" />
                Add
              </Button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No events scheduled
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Double-click a date or click Add to schedule a place
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => {
                  const place = getPlaceById(event.placeId)
                  if (!place) return null

                  return (
                    <Card key={event.id} className="p-3">
                      <div className="flex items-start gap-3">
                        {place.photos?.[0] && (
                          <img
                            src={place.photos[0]}
                            alt={place.name}
                            className="size-12 rounded-md object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium">
                            {place.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>
                              {formatTime(event.startTime)} ({formatDuration(event.duration)})
                            </span>
                          </div>
                          {event.notes && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {event.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveEvent(event.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{scheduledEvents.length} events total</span>
          <span>{places.length} places</span>
        </div>
      </div>
    </div>
  )
}
