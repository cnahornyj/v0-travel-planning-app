"use client"

import { useState, useEffect } from "react"
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
import { Calendar, Clock, MapPin } from "lucide-react"
import type { Place, ScheduledEvent } from "./travel-planner"

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  places: Place[]
  onSave: (event: Omit<ScheduledEvent, "id">) => void
  initialDate?: string
  initialPlaceId?: string
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

export function EventDialog({
  isOpen,
  onClose,
  places,
  onSave,
  initialDate,
  initialPlaceId,
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
      setStartTime("10:00")
      setDuration("120")
      setNotes("")
      setError("")
    }
  }, [isOpen, initialDate, initialPlaceId])

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

  const selectedPlace = places.find((p) => p.id === selectedPlaceId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Schedule Event
          </DialogTitle>
          <DialogDescription>
            Add a place to your schedule for this trip.
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add to Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
