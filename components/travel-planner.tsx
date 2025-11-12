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
        console.log("[v0] Place removed from saved places successfully")
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
    console.log("[v0] handleAddPlaceToTrip called with tripId:", tripId, "place:", place.name)
    if (!tripId || tripId === "undefined") {
      console.error("[v0] Cannot add place to trip with invalid ID:", tripId)
      return
    }

    const trip = trips.find((t) => t.id === tripId)
    console.log("[v0] Found trip:", trip?.name)
    if (trip && !trip.places.some((p) => p.id === place.id)) {
      console.log("[v0] Place not in trip yet, adding...")
      const updatedPlaces = [...trip.places, place]
      await handleUpdateTrip(tripId, { places: updatedPlaces })
      console.log("[v0] Place added successfully")
    } else if (trip) {
      console.log("[v0] Place already in trip")
    } else {
      console.log("[v0] Trip not found")
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
    console.log("[v0] handleUpdateSavedPlaceImages called for place:", placeId)
    console.log("[v0] New userImages:", userImages)

    setIsSyncing(true)
    try {
      const place =
        savedPlaces.find((p) => p.id === placeId) ||
        trips.flatMap((t) => t.places).find((p) => p.id === placeId) ||
        selectedPlace

      console.log("[v0] Place found:", place)
      console.log("[v0] Making API call to update images...")

      const response = await fetch(`/api/places?id=${placeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImages, place }),
      })

      const responseData = await response.json()
      console.log("[v0] API response:", responseData)

      if (response.ok) {
        console.log("[v0] Successfully updated images in database")

        if (selectedPlace && selectedPlace.id === placeId) {
          setSelectedPlace((prev) => (prev ? { ...prev, userImages } : null))
        }

        setSavedPlaces((prev) => {
          const existing = prev.find((p) => p.id === placeId)
          if (existing) {
            return prev.map((p) => (p.id === placeId ? { ...p, userImages } : p))
          } else if (place) {
            return [...prev, { ...place, userImages, saved: true }]
          }
          return prev
        })

        setTrips((prev) =>
          prev.map((trip) => ({
            ...trip,
            places: trip.places.map((p) => (p.id === placeId ? { ...p, userImages } : p)),
          })),
        )

        console.log("[v0] Updated images for place:", placeId)
      } else {
        console.error("[v0] Failed to update place images, response:", responseData)
      }
    } catch (error) {
      console.error("[v0] Error updating place images:", error)
    } finally {
      setIsSyncing(false)
    }
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg text-muted-foreground">Loading your travel plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Travel Planner</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="mr-2 size-4" />
              Import
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-96 flex-col border-r">
          <div className="flex border-b">
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              onClick={() => setActiveTab("search")}
              className="flex-1"
            >
              <Search className="mr-2 size-4" />
              Search
            </Button>
            <Button
              variant={activeTab === "saved" ? "default" : "ghost"}
              onClick={() => setActiveTab("saved")}
              className="flex-1"
            >
              <Heart className="mr-2 size-4" />
              Saved ({savedPlaces.length})
            </Button>
            <Button
              variant={activeTab === "trips" ? "default" : "ghost"}
              onClick={() => setActiveTab("trips")}
              className="flex-1"
            >
              <Calendar className="mr-2 size-4" />
              Trips ({trips.length})
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeTab === "search" && (
              <PlaceSearch
                onPlaceSelect={handlePlaceSelect}
                onSavePlace={handleSavePlace}
                savedPlaceIds={savedPlaces.map((p) => p.id)}
                selectedPlace={selectedPlace}
                onShowDetails={() => setShowPlaceDetails(true)}
                onLocationChange={(location) => setMapCenter({ lat: location.lat, lng: location.lng })}
                trips={trips}
                onAddPlaceToTrip={handleAddPlaceToTrip}
              />
            )}
            {activeTab === "saved" && (
              <SavedPlaces
                places={savedPlaces}
                onPlaceSelect={handlePlaceSelect}
                onRemovePlace={handleRemovePlace}
                trips={trips}
                onAddPlaceToTrip={handleAddPlaceToTrip}
              />
            )}
            {activeTab === "trips" && (
              <TripDashboard
                trips={trips}
                onCreateTrip={handleCreateTrip}
                onUpdateTrip={handleUpdateTrip}
                onDeleteTrip={handleDeleteTrip}
                onAddPlaceToTrip={handleAddPlaceToTrip}
                onRemovePlaceFromTrip={handleRemovePlaceFromTrip}
                onUpdatePlaceNotes={handleUpdatePlaceNotes}
                onUpdatePlaceTags={handleUpdatePlaceTags}
                onUpdatePlaceVisitPreference={handleUpdatePlaceVisitPreference}
                onUpdatePlaceImages={handleUpdatePlaceImages}
                savedPlaces={savedPlaces}
                onPlaceSelect={handlePlaceSelect}
              />
            )}
          </div>
        </div>

        <div className="flex-1">
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
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-background/50">
          <div className="rounded-lg bg-card p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm font-medium">Syncing...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
