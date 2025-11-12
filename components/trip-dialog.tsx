"use client"

import { useState } from "react"
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
import type { Trip } from "@/app/page"

interface TripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (trip: Omit<Trip, "id">) => void
  trip?: Trip
}

export function TripDialog({ open, onOpenChange, onSave, trip }: TripDialogProps) {
  const [name, setName] = useState(trip?.name || "")
  const [destination, setDestination] = useState(trip?.destination || "")
  const [startDate, setStartDate] = useState(trip?.startDate || "")
  const [endDate, setEndDate] = useState(trip?.endDate || "")

  const handleSave = () => {
    if (name && destination && startDate && endDate) {
      onSave({
        name,
        destination,
        startDate,
        endDate,
        places: trip?.places || [],
      })
      // Reset form
      setName("")
      setDestination("")
      setStartDate("")
      setEndDate("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{trip ? "Edit Trip" : "Create New Trip"}</DialogTitle>
          <DialogDescription>Plan your next adventure by adding trip details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input
              id="name"
              placeholder="e.g., Summer Vacation 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="e.g., Paris, France"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{trip ? "Save Changes" : "Create Trip"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
