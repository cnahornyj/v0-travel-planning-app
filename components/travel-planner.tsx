"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { GoogleMap } from "./google-map"
import { PlaceSearch } from "./place-search"
import { SavedPlaces } from "./saved-places"
import { TripDashboard } from "./trip-dashboard"
import { PlaceDetails } from "./place-details"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Heart, Calendar, Download, Upload, User, LogOut, Database, WifiOff } from "lucide-react"
import { usePlaces } from "@/hooks/use-places"
import { useTrips } from "@/hooks/use-trips"
import { usePreferences } from "@/hooks/use-preferences"

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
  const { data: session } = useSession()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)

  const {
    places: savedPlaces,
    savePlace,
    removePlace,
    updatePlaceImages: updateSavedPlaceImages,
    isAuthenticated: placesAuth,
  } = usePlaces()
  const {
    trips,
    createTrip,
    updateTrip,
    deleteTrip,
    addPlaceToTrip,
    removePlaceFromTrip,
    isAuthenticated: tripsAuth,
  } = useTrips()
  const { preferences, setMapCenter, setActiveTab, isAuthenticated: prefsAuth } = usePreferences()

  const { mapCenter, activeTab } = preferences

  const handlePlaceSelect = useCallback(
    (place: Place) => {
      setSelectedPlace(place)
      setMapCenter({ lat: place.lat, lng: place.lng })
      setShowPlaceDetails(true)
    },
    [setMapCenter],
  )

  const handleSavePlace = async (place: Place) => {
    try {
      await savePlace(place)
    } catch (error) {
      console.error("Failed to save place:", error)
      // You could add a toast notification here
    }
  }

  const handleRemovePlace = async (placeId: string) => {
    try {
      await removePlace(placeId)
    } catch (error) {
      console.error("Failed to remove place:", error)
    }
  }

  const handleCreateTrip = async (tripData: Omit<Trip, "id" | "createdAt">) => {
    try {
      await createTrip(tripData)
    } catch (error) {
      console.error("Failed to create trip:", error)
    }
  }

  const handleUpdateTrip = async (tripId: string, updates: Partial<Trip>) => {
    try {
      await updateTrip(tripId, updates)
    } catch (error) {
      console.error("Failed to update trip:", error)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip(tripId)
    } catch (error) {
      console.error("Failed to delete trip:", error)
    }
  }

  const handleAddPlaceToTrip = async (tripId: string, place: Place) => {
    try {
      await addPlaceToTrip(tripId, place)
    } catch (error) {
      console.error("Failed to add place to trip:", error)
    }
  }

  const handleRemovePlaceFromTrip = async (tripId: string, placeId: string) => {
    try {
      await removePlaceFromTrip(tripId, placeId)
    } catch (error) {
      console.error("Failed to remove place from trip:", error)
    }
  }

  const handleUpdatePlaceNotes = async (tripId: string, placeId: string, notes: string) => {
    // Find the trip and update the place notes locally for immediate UI feedback
    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((place) => (place.id === placeId ? { ...place, notes } : place))
      await updateTrip(tripId, { ...trip, places: updatedPlaces })
    }
  }

  const handleUpdatePlaceTags = async (tripId: string, placeId: string, tags: string[]) => {
    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((place) => (place.id === placeId ? { ...place, tags } : place))
      await updateTrip(tripId, { ...trip, places: updatedPlaces })
    }
  }

  const handleUpdatePlaceVisitPreference = async (
    tripId: string,
    placeId: string,
    visitPreference: Place["visitPreference"],
  ) => {
    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((place) => (place.id === placeId ? { ...place, visitPreference } : place))
      await updateTrip(tripId, { ...trip, places: updatedPlaces })
    }
  }

  const handleUpdatePlaceImages = async (tripId: string, placeId: string, userImages: string[]) => {
    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      const updatedPlaces = trip.places.map((place) => (place.id === placeId ? { ...place, userImages } : place))
      await updateTrip(tripId, { ...trip, places: updatedPlaces })
    }
  }

  const handleExportData = () => {
    const data = {
      savedPlaces,
      trips,
      exportDate: new Date().toISOString(),
      version: "2.0", // Updated version for database format
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
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Import saved places
        if (data.savedPlaces && Array.isArray(data.savedPlaces)) {
          for (const place of data.savedPlaces) {
            try {
              await savePlace(place)
            } catch (error) {
              console.error("Failed to import place:", place.name, error)
            }
          }
        }

        // Import trips
        if (data.trips && Array.isArray(data.trips)) {
          for (const trip of data.trips) {
            try {
              await createTrip({
                name: trip.name,
                description: trip.description,
                startDate: trip.startDate,
                endDate: trip.endDate,
                places: trip.places || [],
              })
            } catch (error) {
              console.error("Failed to import trip:", trip.name, error)
            }
          }
        }

        alert("Data imported successfully!")
      } catch (error) {
        alert("Error importing data. Please check the file format.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const allTripPlaces = trips.flatMap((trip) => trip.places)
  const isOnline = placesAuth && tripsAuth && prefsAuth

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-96 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Travel Planner</h1>
            <div className="flex items-center gap-2">
              {/* Data backup/restore buttons */}
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

              {session?.user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user.name && <p className="font-medium">{session.user.name}</p>}
                        {session.user.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
              onUpdatePlaceImages={handleUpdatePlaceImages}
            />
          )}
        </div>

        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isOnline ? (
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Data synced to cloud
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline mode
                </div>
              )}
            </span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <span>{isOnline ? "Connected" : "Local only"}</span>
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
            onUpdateImages={updateSavedPlaceImages}
          />
        )}
      </div>
    </div>
  )
}
