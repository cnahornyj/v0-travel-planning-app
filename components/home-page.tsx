"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Info, Plus, Trash2 } from "lucide-react"
import { TravelSpinner } from "@/components/ui/travel-spinner"
import { VeryDiscoLogo } from "@/components/ui/verydisco-logo"
import { AnimatedTagline } from "@/components/ui/animated-tagline"
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null)

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

  const handleDeleteClick = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation()
    setTripToDelete(trip)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return

    try {
      const response = await fetch(`/api/trips/${tripToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id))
      }
    } catch (error) {
      console.error("Error deleting trip:", error)
    } finally {
      setDeleteDialogOpen(false)
      setTripToDelete(null)
    }
  }

  const getFirstImage = (trip: Trip) => {
    const firstPlace = trip.places.find((place) => place.photos && place.photos.length > 0)
    return firstPlace?.photos?.[0] || "/diverse-travel-destinations.png"
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <TravelSpinner size="lg" message="Discovering destinations..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-8 py-6 shadow-md shadow-black/15">
        <VeryDiscoLogo size="lg" />
      </header>

      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-8 flex flex-col items-center gap-4">
          <AnimatedTagline />
          <p className="text-muted-foreground text-center max-w-md">
            No more Excel acrobatics. No more email archaeology.
            <br />
            Just travel.
          </p>
          <Button size="lg" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 size-5" />
            Create a destination
          </Button>
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="group cursor-pointer overflow-hidden border border-border/50 bg-card p-0 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-border"
              onClick={() => router.push(`/destinations/${trip.id}`)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={getFirstImage(trip) || "/placeholder.svg"}
                  alt={trip.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <h3 className="text-lg font-semibold text-foreground">{trip.name}</h3>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/destinations/${trip.id}`)
                    }}
                    className="size-9 rounded-full hover:bg-muted"
                  >
                    <Info className="size-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDeleteClick(e, trip)}
                    className="size-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Destination</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete {tripToDelete?.name}?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
