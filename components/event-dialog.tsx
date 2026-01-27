"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, MapPin, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Place, ScheduledEvent } from "./travel-planner"

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  places: Place[]
  onSave: (event: Omit<ScheduledEvent, "id">) => void
  initialDate?: string
  initialPlaceId?: string
  initialStartTime?: string
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
  { value: "300", label: "5 hours" },
  { value: "360", label: "6 hours" },
  { value: "480", label: "8 hours (full day)" },
]

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function getOpeningHoursInfo(
  place: Place | undefined,
  date: string,
  startTime: string,
  duration: number
): { isOpen: boolean; warning?: string; hours?: string } {
  if (!place?.openingHours?.periods || place.openingHours.periods.length === 0) {
    return { isOpen: true }
  }

  // Parse date parts manually to avoid timezone issues
  const [year, month, day] = date.split("-").map(Number)
  const dateObj = new Date(year, month - 1, day)
  const dayOfWeek = dateObj.getDay()
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration

  // Get the weekday text for this day
  // Google weekdayText can use different indexing (Sunday=0 or Monday=0)
  // Try to get the text for this day
  const dayText = place.openingHours.weekdayText?.[dayOfWeek] || 
                  place.openingHours.weekdayText?.[dayOfWeek === 0 ? 6 : dayOfWeek - 1]

  // Find periods for this day
  const periodsForDay = place.openingHours.periods.filter(
    (period) => period.open.day === dayOfWeek
  )

  if (periodsForDay.length === 0) {
    return {
      isOpen: false,
      warning: `This place appears to be closed on this day`,
      hours: dayText || "Closed",
    }
  }

  // Check if the event time falls within any open period
  for (const period of periodsForDay) {
    const openTime = period.open.time
    const openMinutes = timeToMinutes(
      openTime.slice(0, 2) + ":" + openTime.slice(2)
    )
    const closeMinutes = period.close
      ? timeToMinutes(
          period.close.time.slice(0, 2) + ":" + period.close.time.slice(2)
        )
      : 24 * 60

    if (startMinutes >= openMinutes && endMinutes <= closeMinutes) {
      return { isOpen: true, hours: dayText }
    }
  }

  return {
    isOpen: false,
    warning: "Your scheduled time is outside opening hours",
    hours: dayText,
  }
}

export function EventDialog({
  isOpen,
  onClose,
  places,
  onSave,
  initialDate,
  initialPlaceId,
  initialStartTime,
}: EventDialogProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("10:00")
  const [duration, setDuration] = useState<string>("120")
  const [notes, setNotes] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaceId(initialPlaceId || "")
      setDate(initialDate || new Date().toISOString().split("T")[0])
      setStartTime(initialStartTime || "10:00")
      setDuration("120")
      setNotes("")
      setError("")
    }
  }, [isOpen, initialDate, initialPlaceId, initialStartTime])

  const selectedPlace = places.find((p) => p.id === selectedPlaceId)

  const openingHoursInfo = useMemo(() => {
    if (!selectedPlaceId || !date || !startTime) return null
    return getOpeningHoursInfo(
      selectedPlace,
      date,
      startTime,
      parseInt(duration, 10)
    )
  }, [selectedPlace, selectedPlaceId, date, startTime, duration])

  const handleSubmit = () => {
    if (!selectedPlaceId) {
      setError("Please select a place")
      return
    }
    if (!date) {
      setError("Please select a date")
      return
    }
    if (!startTime) {
      setError("Please select a start time")
      return
    }

    onSave({
      placeId: selectedPlaceId,
      date,
      startTime,
      duration: parseInt(duration, 10),
      notes: notes.trim() || undefined,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Schedule Event
          </DialogTitle>
          <DialogDescription>
            Add a place to your schedule. Times outside opening hours will show a warning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Place Selection */}
          <div className="space-y-2">
            <Label htmlFor="place">Place</Label>
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger id="place">
                <SelectValue placeholder="Select a place" />
              </SelectTrigger>
              <SelectContent>
                {places.map((place) => (
                  <SelectItem key={place.id} value={place.id}>
                    <div className="flex items-center gap-2">
                      {place.photos?.[0] && (
                        <img
                          src={place.photos[0]}
                          alt=""
                          className="size-5 rounded object-cover"
                        />
                      )}
                      <span className="truncate">{place.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlace && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">{selectedPlace.address}</span>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="size-3" />
                Start Time
              </Label>
              <Input
                id="time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opening Hours Display */}
          {selectedPlace?.openingHours?.weekdayText && selectedPlace.openingHours.weekdayText.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                Opening Hours
              </Label>
              <div className="rounded-md border bg-muted/50 p-3">
                <div className="grid gap-1 text-xs">
                  {selectedPlace.openingHours.weekdayText.map((text, index) => {
                    // Parse date to get the day of week for comparison
                    const [year, month, day] = date.split("-").map(Number)
                    const selectedDate = new Date(year, month - 1, day)
                    const selectedDayOfWeek = selectedDate.getDay()
                    // weekdayText is usually in order starting from Sunday or Monday
                    const isSelectedDay = index === selectedDayOfWeek || index === (selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1)
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex justify-between rounded px-2 py-0.5",
                          isSelectedDay && "bg-primary/10 font-medium text-primary"
                        )}
                      >
                        <span>{text}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Warning if outside opening hours */}
          {openingHoursInfo && !openingHoursInfo.isOpen && openingHoursInfo.warning && (
            <Alert variant="default" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertDescription>{openingHoursInfo.warning}</AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes for this visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add to Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
