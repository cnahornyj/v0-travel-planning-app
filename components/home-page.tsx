"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Info, Plus } from "lucide-react"
import type { Trip } from "@/components/travel-planner"

export function HomePage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTrip, setNewTrip] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips")
        const data = await response.json()
        const tripsWithIds = (data.trips || []).map((trip: any) => ({
          ...trip,
          id: trip._id?.toString() || trip.id,
        }))
        setTrips(tripsWithIds)
      } catch (error) {
        console.error("Error loading trips:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrips()
  }, [])

  const handleCreateTrip = async () => {
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTrip, places: [] }),
      })

      if (response.ok) {
        const { trip } = await response.json()
        const tripWithId = { ...trip, id: trip._id.toString() }
        setTrips((prev) => [...prev, tripWithId])
        setShowCreateDialog(false)
        setNewTrip({ name: "", description: "", startDate: "", endDate: "" })
      }
    } catch (error) {
      console.error("Error creating trip:", error)
    }
  }

  const getFirstImage = (trip: Trip) => {
    const firstPlace = trip.places.find((place) => place.photos && place.photos.length > 0)
    return firstPlace?.photos?.[0] || "/diverse-travel-destinations.png"
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg text-muted-foreground">Loading destinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-8">
        <h1 className="text-center text-4xl font-bold tracking-tight">verydisco</h1>
      </header>

      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-8 flex justify-center">
          <Button size="lg" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 size-5" />
            Create a destination
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={getFirstImage(trip) || "/placeholder.svg"}
                  alt={trip.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <h3 className="text-lg font-semibold">{trip.name}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => router.push(`/destinations/${trip.id}`)}
                  className="shrink-0"
                >
                  <Info className="size-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {trips.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No destinations yet. Create your first one to get started!</p>
          </div>
        )}
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Destination Name</Label>
              <Input
                id="name"
                value={newTrip.name}
                onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                placeholder="e.g., Tokyo Adventure"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newTrip.description}
                onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                placeholder="Describe your trip..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newTrip.startDate}
                  onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newTrip.endDate}
                  onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreateTrip} disabled={!newTrip.name} className="w-full">
              Create Destination
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
