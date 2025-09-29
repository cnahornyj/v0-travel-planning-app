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
  userImages?: string[] // Added user-uploaded images array
  saved?: boolean
  notes?: string
  tags?: string[]
  visitPreference?: "morning" | "afternoon" | "evening" | "night" | "anytime"
  // New detailed fields
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
        setTrips(tripsData.trips || [])
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

  const handleAddPlaceToTrip = (tripId: string, place: Place) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId && !trip.places.some((p) => p.id === place.id)
        ? { ...trip, places: [...trip.places, place] }
        : trip,
    )
    const updatedTrip = updatedTrips.find((t) => t.id === tripId)
    if (updatedTrip) {
      handleUpdateTrip(tripId, { places: updatedTrip.places })
    }
  }

  const handleRemovePlaceFromTrip = (tripId: string, placeId: string) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId ? { ...trip, places: trip.places.filter((p) => p.id !== placeId) } : trip,
    )
    const updatedTrip = updatedTrips.find((t) => t.id === tripId)
    if (updatedTrip) {
      handleUpdateTrip(tripId, { places: updatedTrip.places })
    }
  }

  const handleUpdatePlaceNotes = (tripId: string, placeId: string, notes: string) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            places: trip.places.map((place) => (place.id === placeId ? { ...place, notes } : place)),
          }
        : trip,
    )
    const updatedTrip = updatedTrips.find((t) => t.id === tripId)
    if (updatedTrip) {
      handleUpdateTrip(tripId, { places: updatedTrip.places })
    }
  }

  const handleUpdatePlaceTags = (tripId: string, placeId: string, tags: string[]) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            places: trip.places.map((place) => (place.id === placeId ? { ...place, tags } : place)),
          }
        : trip,
    )
    const updatedTrip = updatedTrips.find((t) => t.id === tripId)
    if (updatedTrip) {
      handleUpdateTrip(tripId, { places: updatedTrip.places })
    }
  }

  const handleUpdatePlaceVisitPreference = (
    tripId: string,
    placeId: string,
    visitPreference: Place["visitPreference"],
  ) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            places: trip.places.map((place) => (place.id === placeId ? { ...place, visitPreference } : place)),
          }
        : trip,
    )
    const updatedTrip = updatedTrips.find((t) => t.id === tripId)
    if (updatedTrip) {
      handleUpdateTrip(tripId, { places: updatedTrip.places })
    }
  }

  const handleUpdatePlaceImages = (tripId: string, placeId: string, userImages: string[]) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            places: trip.places.map((place) => (place.id === placeId ? { ...place, userImages } : place)),
          }
        : trip,
    )
    const updatedTrip = updatedTrips.find((t) => t.id === tripId)
    if (updatedTrip) {
      handleUpdateTrip(tripId, { places: updatedTrip.places })
    }
  }

  const handleUpdateSavedPlaceImages = (placeId: string, userImages: string[]) => {
    setSavedPlaces((prev) => prev.map((place) => (place.id === placeId ? { ...place, userImages } : place)))
  }

  const handleExportData = () => {
    const data = {
      savedPlaces,
      trips,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `travel-planner-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.savedPlaces && Array.isArray(data.savedPlaces)) {
          setSavedPlaces(data.savedPlaces)
        }
        if (data.trips && Array.isArray(data.trips)) {
          setTrips(data.trips)
        }
        alert("Data imported successfully!")
      } catch (error) {
        alert("Error importing data. Please check the file format.")
      }
    }
    reader.readAsText(file)
    // Reset the input
    event.target.value = ""
  }

  const allTripPlaces = trips.flatMap((trip) => trip.places)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your travel data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-96 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Travel Planner</h1>
            {/* Data backup/restore buttons */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleExportData} title="Export your data">
                <Download className="w-4 h-4" />
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Import data"
                />
                <Button size="sm" variant="outline" title="Import data">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Discover and save amazing places for your next adventure</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <Button
            variant={activeTab === "search" ? "default" : "ghost"}
            className="flex-1 rounded-none border-0 text-xs"
            onClick={() => setActiveTab("search")}
          >
            <Search className="w-4 h-4 mr-1" />
            Search
          </Button>
          <Button
            variant={activeTab === "saved" ? "default" : "ghost"}
            className="flex-1 rounded-none border-0 text-xs"
            onClick={() => setActiveTab("saved")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Saved ({savedPlaces.length})
          </Button>
          <Button
            variant={activeTab === "trips" ? "default" : "ghost"}
            className="flex-1 rounded-none border-0 text-xs"
            onClick={() => setActiveTab("trips")}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Trips ({trips.length})
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "search" ? (
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              onSavePlace={handleSavePlace}
              savedPlaceIds={savedPlaces.map((p) => p.id)}
              onLocationChange={(location) => setMapCenter({ lat: location.lat, lng: location.lng })}
              selectedPlace={selectedPlace}
              onShowDetails={() => setShowPlaceDetails(true)}
              trips={trips}
              onAddPlaceToTrip={handleAddPlaceToTrip}
            />
          ) : activeTab === "saved" ? (
            <SavedPlaces places={savedPlaces} onPlaceSelect={handlePlaceSelect} onRemovePlace={handleRemovePlace} />
          ) : (
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
              onUpdatePlaceImages={handleUpdatePlaceImages} // Added image update handler
            />
          )}
        </div>

        {/* Data persistence status indicator */}
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Data saved to MongoDB</span>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${isSyncing ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}
              ></div>
              <span>{isSyncing ? "Syncing..." : "Synced"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          center={mapCenter}
          selectedPlace={selectedPlace}
          savedPlaces={[...savedPlaces, ...allTripPlaces]}
          onPlaceSelect={handlePlaceSelect}
        />

        {showPlaceDetails && selectedPlace && (
          <PlaceDetails
            place={selectedPlace}
            onClose={() => setShowPlaceDetails(false)}
            onSave={handleSavePlace}
            isSaved={savedPlaces.some((p) => p.id === selectedPlace.id)}
            trips={trips}
            onAddPlaceToTrip={handleAddPlaceToTrip}
            onUpdateImages={handleUpdateSavedPlaceImages} // Added image update handler for place details
          />
        )}
      </div>
    </div>
  )
}
