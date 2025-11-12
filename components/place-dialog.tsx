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
import { Textarea } from "@/components/ui/textarea"
import type { Trip, Place } from "@/app/page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { MapPin, AlertCircle } from "lucide-react"

interface PlaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Trip
  onUpdate: (trip: Trip) => void
}

export function PlaceDialog({ open, onOpenChange, trip, onUpdate }: PlaceDialogProps) {
  const [selectedTab, setSelectedTab] = useState<"search" | "manual">("search")

  // Manual entry states
  const [manualName, setManualName] = useState("")
  const [manualAddress, setManualAddress] = useState("")
  const [manualNotes, setManualNotes] = useState("")

  const handleAddManualPlace = () => {
    console.log("[v0] Manual place entry:", { manualName, manualAddress, manualNotes })

    if (manualName && manualAddress) {
      const newPlace: Place = {
        id: Date.now().toString(),
        name: manualName,
        address: manualAddress,
        notes: manualNotes || undefined,
      }

      console.log("[v0] Created place:", newPlace)

      const updatedTrip = {
        ...trip,
        places: [...trip.places, newPlace],
      }

      console.log("[v0] Updated trip:", updatedTrip)
      onUpdate(updatedTrip)

      // Reset form
      setManualName("")
      setManualAddress("")
      setManualNotes("")
      onOpenChange(false)
    }
  }

  const handleAddGooglePlace = (place: Place) => {
    const updatedTrip = {
      ...trip,
      places: [...trip.places, place],
    }
    onUpdate(updatedTrip)
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setManualName("")
      setManualAddress("")
      setManualNotes("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Place to {trip.name}</DialogTitle>
          <DialogDescription>Search for a place on Google Maps or manually enter an address</DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "search" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Maps</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800">
                  Can't find your place? Switch to the{" "}
                  <button onClick={() => setSelectedTab("manual")} className="font-semibold underline">
                    Manual Entry
                  </button>{" "}
                  tab to add it by address.
                </p>
              </div>
            </div>

            <GooglePlacesAutocomplete onPlaceSelect={handleAddGooglePlace} />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Can't find your place?</p>
                  <p className="text-sm text-muted-foreground">
                    Manually enter the place details if it's not available on Google Maps
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="place-name">Place Name *</Label>
                <Input
                  id="place-name"
                  placeholder="e.g., Yuen Shinjuku Onsen"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g., 5 Chome-3-18 Shinjuku, Shinjuku City, Tokyo"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this place..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddManualPlace} disabled={!manualName || !manualAddress}>
                Add Place
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
