"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { GoogleMap } from "./google-map"
import { PlaceSearch } from "./place-search"
import { SavedPlaces } from "./saved-places"
import { TripDashboard } from "./trip-dashboard"
import { PlaceDetails } from "./place-details"
import { Button } from "@/components/ui/button"
import { Search, Heart, Calendar, Download, Upload } from "lucide-react"

export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type?: string
  rating?: number
  photos?: string[]
  userImages?: string[]
  saved?: boolean
  notes?: string
  tags?: string[]
  visitPreference?: "morning" | "afternoon" | "evening" | "night" | "anytime"
  phone?: string
  website?: string
  openingHours?: {
    periods: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
    weekdayText: string[]
  }
  isOpen?: boolean
  priceLevel?: number
  reviews?: Array<{
    author: string
    rating: number
    text: string
    time: number
  }>
}

export interface Trip {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  places: Place[]
  createdAt: string
}

export function TravelPlanner() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTab, setActiveTab] = useState<"search" | "saved" | "trips">("search")
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.006,
  })
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("[v0] Loading data from MongoDB...")
        const [placesRes, tripsRes] = await Promise.all([fetch("/api/places"), fetch("/api/trips")])

        const placesData = await placesRes.json()
        const tripsData = await tripsRes.json()

        console.log("[v0] Loaded places:", placesData.places?.length || 0)
        console.log("[v0] Loaded trips:", tripsData.trips?.length || 0)

        setSavedPlaces(placesData.places || [])
        const tripsWithIds = (tripsData.trips || []).map((trip: any) => ({
          ...trip,
          id: trip._id?.toString() || trip.id,
        }))
        setTrips(tripsWithIds)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handlePlaceSelect = useCallback(
    (place: Place) => {
      setSelectedPlace(place)
      setMapCenter({ lat: place.lat, lng: place.lng })
      setShowPlaceDetails(true)
    },
    [setMapCenter],
  )

  const handleSavePlace = async (place: Place) => {
    const isAlreadySaved = savedPlaces.some((p) => p.id === place.id)
    if (!isAlreadySaved) {
      setIsSyncing(true)
      try {
        const response = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...place, saved: true }),
        })

        if (response.ok) {
          setSavedPlaces((prev) => [...prev, { ...place, saved: true }])
          console.log("[v0] Place saved successfully")
        }
      } catch (error) {
        console.error("[v0] Error saving place:", error)
      } finally {
        setIsSyncing(false)
      }
    }
  }

  const handleRemovePlace = async (placeId: string) => {
    if (!placeId || placeId === "undefined") {
      console.error("[v0] Cannot delete place with invalid ID:", placeId)
      return
    }

    console.log("[v0] Attempting to delete place with ID:", placeId)
    setIsSyncing(true)
    try {
      const response = await fetch(`/api/places?id=${placeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId))
        setTrips((prev) =>
          prev.map((trip) => ({
            ...trip,
            places: trip.places.filter((p) => p.id !== placeId),
          })),
        )
        console.log("[v0] Place removed successfully")
      } else {
        console.error("[v0] Failed to delete place, response status:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error removing place:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCreateTrip = async (tripData: Omit<Trip, "id" | "createdAt">) => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      })

      if (response.ok) {
        const { trip } = await response.json()
        setTrips((prev) => [...prev, { ...trip, id: trip._id.toString() }])
        console.log("[v0] Trip created successfully")
      }
    } catch (error) {
      console.error("[v0] Error creating trip:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUpdateTrip = async (tripId: string, updates: Partial<Trip>) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot update trip with invalid ID:", tripId)
      return
    }

    setIsSyncing(true)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        setTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip)))
        console.log("[v0] Trip updated successfully")
      }
    } catch (error) {
      console.error("[v0] Error updating trip:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot delete trip with invalid ID:", tripId)
      return
    }

    setIsSyncing(true)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
        console.log("[v0] Trip deleted successfully")
      }
    } catch (error) {
      console.error("[v0] Error deleting trip:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAddPlaceToTrip = async (tripId: string, place: Place) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot add place to trip with invalid ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    if (trip && !trip.places.some((p) => p.id === place.id)) {
      const updatedPlaces = [...trip.places, place]
      await handleUpdateTrip(tripId, { places: updatedPlaces })
    }
  }

  const handleRemovePlaceFromTrip = async (tripId: string, placeId: string) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot remove place from trip with invalid ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.filter((p) => p.id !== placeId)
      await handleUpdateTrip(tripId, { places: updatedPlaces })
    }
  }

  const handleUpdatePlaceNotes = async (tripId: string, placeId: string, notes: string) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot update place notes with invalid trip ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, notes } : p))
      await handleUpdateTrip(tripId, { places: updatedPlaces })
    }
  }

  const handleUpdatePlaceTags = async (tripId: string, placeId: string, tags: string[]) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot update place tags with invalid trip ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, tags } : p))
      await handleUpdateTrip(tripId, { places: updatedPlaces })
    }
  }

  const handleUpdatePlaceVisitPreference = async (
    tripId: string,
    placeId: string,
    visitPreference: Place["visitPreference"],
  ) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot update visit preference with invalid trip ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, visitPreference } : p))
      await handleUpdateTrip(tripId, { places: updatedPlaces })
    }
  }

  const handleUpdatePlaceImages = async (tripId: string, placeId: string, userImages: string[]) => {
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot update place images with invalid trip ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, userImages } : p))
      await handleUpdateTrip(tripId, { places: updatedPlaces })
    }
  }

  const handleUpdateSavedPlaceImages = async (placeId: string, userImages: string[]) => {
    setSavedPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, userImages } : p)))

    // Also update in any trips that contain this place
    setTrips((prev) =>
      prev.map((trip) => ({
        ...trip,
        places: trip.places.map((p) => (p.id === placeId ? { ...p, userImages } : p)),
      })),
    )

    console.log("[v0] Updated images for place:", placeId)
  }

  const handleExportData = () => {
    const data = {
      places: savedPlaces,
      trips: trips,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `travel-planner-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.places) {
          for (const place of data.places) {
            await handleSavePlace(place)
          }
        }
        if (data.trips) {
          for (const trip of data.trips) {
            await handleCreateTrip(trip)
          }
        }
      } catch (error) {
        console.error("[v0] Error importing data:", error)
      }
    }
    reader.readAsText(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your travel plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Travel Planner</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                </label>
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "search" ? "default" : "outline"}
              onClick={() => setActiveTab("search")}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant={activeTab === "saved" ? "default" : "outline"}
              onClick={() => setActiveTab("saved")}
              className="flex-1"
            >
              <Heart className="h-4 w-4 mr-2" />
              Saved ({savedPlaces.length})
            </Button>
            <Button
              variant={activeTab === "trips" ? "default" : "outline"}
              onClick={() => setActiveTab("trips")}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Trips ({trips.length})
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-1/2 overflow-y-auto p-4">
          {activeTab === "search" && (
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              onSavePlace={handleSavePlace}
              savedPlaceIds={savedPlaces.map((p) => p.id)}
              selectedPlace={selectedPlace}
              onShowDetails={() => setShowPlaceDetails(true)}
              trips={trips}
              onAddPlaceToTrip={handleAddPlaceToTrip}
            />
          )}
          {activeTab === "saved" && (
            <SavedPlaces places={savedPlaces} onPlaceSelect={handlePlaceSelect} onRemovePlace={handleRemovePlace} />
          )}
          {activeTab === "trips" && (
            <TripDashboard
              trips={trips}
              savedPlaces={savedPlaces}
              onCreateTrip={handleCreateTrip}
              onUpdateTrip={handleUpdateTrip}
              onDeleteTrip={handleDeleteTrip}
              onAddPlaceToTrip={handleAddPlaceToTrip}
              onRemovePlaceFromTrip={handleRemovePlaceFromTrip}
              onPlaceSelect={handlePlaceSelect}
              onUpdatePlaceNotes={handleUpdatePlaceNotes}
              onUpdatePlaceTags={handleUpdatePlaceTags}
              onUpdatePlaceVisitPreference={handleUpdatePlaceVisitPreference}
              onUpdatePlaceImages={handleUpdatePlaceImages}
            />
          )}
        </div>

        <div className="hidden md:block w-1/2 relative">
          <GoogleMap
            center={mapCenter}
            selectedPlace={selectedPlace}
            savedPlaces={savedPlaces}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>
      </div>

      {showPlaceDetails && selectedPlace && (
        <PlaceDetails
          place={selectedPlace}
          onClose={() => setShowPlaceDetails(false)}
          onSave={handleSavePlace}
          isSaved={savedPlaces.some((p) => p.id === selectedPlace.id)}
          trips={trips}
          onAddPlaceToTrip={handleAddPlaceToTrip}
          onUpdateImages={handleUpdateSavedPlaceImages}
        />
      )}

      {isSyncing && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Syncing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
