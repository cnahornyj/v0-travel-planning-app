"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { GoogleMap } from "./google-map"
import { PlaceSearch } from "./place-search"
import { SavedPlaces } from "./saved-places"
import { TripDashboard } from "./trip-dashboard"
import { PlaceDetails } from "./place-details"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"
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
  saved?: boolean
  notes?: string
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
  const [savedPlaces, setSavedPlaces] = useLocalStorage<Place[]>("travel-planner-saved-places", [])
  const [trips, setTrips] = useLocalStorage<Trip[]>("travel-planner-trips", [])
  const [activeTab, setActiveTab] = useLocalStorage<"search" | "saved" | "trips">("travel-planner-active-tab", "search")
  const [mapCenter, setMapCenter] = useLocalStorage<{ lat: number; lng: number }>("travel-planner-map-center", {
    lat: 40.7128,
    lng: -74.006,
  })
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)

  const handlePlaceSelect = useCallback(
    (place: Place) => {
      setSelectedPlace(place)
      setMapCenter({ lat: place.lat, lng: place.lng })
      setShowPlaceDetails(true)
    },
    [setMapCenter],
  )

  const handleSavePlace = (place: Place) => {
    const isAlreadySaved = savedPlaces.some((p) => p.id === place.id)
    if (!isAlreadySaved) {
      setSavedPlaces((prev) => [...prev, { ...place, saved: true }])
    }
  }

  const handleRemovePlace = (placeId: string) => {
    setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId))
    setTrips((prev) =>
      prev.map((trip) => ({
        ...trip,
        places: trip.places.filter((p) => p.id !== placeId),
      })),
    )
  }

  const handleCreateTrip = (tripData: Omit<Trip, "id" | "createdAt">) => {
    const newTrip: Trip = {
      ...tripData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setTrips((prev) => [...prev, newTrip])
  }

  const handleUpdateTrip = (tripId: string, updates: Partial<Trip>) => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip)))
  }

  const handleDeleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  }

  const handleAddPlaceToTrip = (tripId: string, place: Place) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId && !trip.places.some((p) => p.id === place.id)
          ? { ...trip, places: [...trip.places, place] }
          : trip,
      ),
    )
  }

  const handleRemovePlaceFromTrip = (tripId: string, placeId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, places: trip.places.filter((p) => p.id !== placeId) } : trip,
      ),
    )
  }

  const handleUpdatePlaceNotes = (tripId: string, placeId: string, notes: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              places: trip.places.map((place) => (place.id === placeId ? { ...place, notes } : place)),
            }
          : trip,
      ),
    )
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
            />
          )}
        </div>

        {/* Data persistence status indicator */}
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Data saved locally</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Auto-sync enabled</span>
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
          />
        )}
      </div>
    </div>
  )
}
