"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MapPin, Plane } from "lucide-react"
import { TripDialog } from "@/components/trip-dialog"
import { TripCard } from "@/components/trip-card"

export interface Place {
  id: string
  name: string
  address: string
  placeId?: string
  lat?: number
  lng?: number
  notes?: string
}

export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  places: Place[]
}

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateTrip = (trip: Omit<Trip, "id">) => {
    const newTrip: Trip = {
      ...trip,
      id: Date.now().toString(),
    }
    setTrips([...trips, newTrip])
    setIsDialogOpen(false)
  }

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(trips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)))
  }

  const handleDeleteTrip = (tripId: string) => {
    setTrips(trips.filter((trip) => trip.id !== tripId))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">TripPlanner</h1>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {trips.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <MapPin className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle>No trips yet</CardTitle>
              <CardDescription>Create your first trip to start planning your adventure</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button onClick={() => setIsDialogOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onUpdate={handleUpdateTrip} onDelete={handleDeleteTrip} />
            ))}
          </div>
        )}
      </main>

      <TripDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleCreateTrip} />
    </div>
  )
}
