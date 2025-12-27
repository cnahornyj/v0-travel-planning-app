"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GoogleMap } from "./google-map"
import { PlaceSearch } from "./place-search"
import { PlaceDetails } from "./place-details"
import { ArrowLeft, Trash2, MapPin, Star, Edit, Filter } from "lucide-react"
import type { Trip, Place } from "./travel-planner"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DestinationPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPlaceSearch, setShowPlaceSearch] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.006,
  })

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const response = await fetch("/api/trips")
        const data = await response.json()
        const trips = (data.trips || []).map((t: any) => ({
          ...t,
          id: t._id?.toString() || t.id,
        }))
        const foundTrip = trips.find((t: Trip) => t.id === tripId)
        setTrip(foundTrip || null)

        if (foundTrip?.places.length > 0) {
          const firstPlace = foundTrip.places[0]
          setMapCenter({ lat: firstPlace.lat, lng: firstPlace.lng })
        }
      } catch (error) {
        console.error("Error loading trip:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrip()
  }, [tripId])

  const handleAddPlace = async (place: Place) => {
    if (!trip) return

    const updatedPlaces = [...trip.places, place]
    await updateTrip({ places: updatedPlaces })
    setShowPlaceSearch(false)
  }

  const handleRemovePlace = async (placeId: string) => {
    if (!trip) return

    const updatedPlaces = trip.places.filter((p) => p.id !== placeId)
    await updateTrip({ places: updatedPlaces })
  }

  const handleUpdateNotes = async (placeId: string, notes: string) => {
    if (!trip) return

    const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, notes } : p))
    await updateTrip({ places: updatedPlaces })
    setEditingNotes(null)
  }

  const handleUpdateTags = async (placeId: string, tags: string[]) => {
    if (!trip) return

    const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, tags } : p))
    await updateTrip({ places: updatedPlaces })
  }

  const handleUpdateVisitPreference = async (placeId: string, visitPreference: Place["visitPreference"]) => {
    if (!trip) return

    const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, visitPreference } : p))
    await updateTrip({ places: updatedPlaces })
  }

  const handleUpdatePlacePhotos = async (placeId: string, photos: string[]) => {
    if (!trip) return

    const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, photos } : p))
    await updateTrip({ places: updatedPlaces })

    if (selectedPlace?.id === placeId) {
      setSelectedPlace((prev) => (prev ? { ...prev, photos } : null))
    }
  }

  const handleUpdatePlaceWebsite = async (placeId: string, website: string) => {
    if (!trip) return

    const updatedPlaces = trip.places.map((p) => (p.id === placeId ? { ...p, website } : p))
    await updateTrip({ places: updatedPlaces })

    if (selectedPlace?.id === placeId) {
      setSelectedPlace((prev) => (prev ? { ...prev, website } : null))
    }
  }

  const updateTrip = async (updates: Partial<Trip>) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        setTrip((prev) => (prev ? { ...prev, ...updates } : null))
      }
    } catch (error) {
      console.error("Error updating trip:", error)
    }
  }

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place)
    setShowPlaceDetails(true)
    setMapCenter({ lat: place.lat, lng: place.lng })
  }, [])

  const getAllTags = (): string[] => {
    if (!trip) return []
    const tags = new Set<string>()
    trip.places.forEach((place) => {
      place.tags?.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  const getFilteredPlaces = (): Place[] => {
    if (!trip) return []
    if (selectedTags.length === 0) return trip.places

    return trip.places.filter((place) => selectedTags.every((selectedTag) => place.tags?.includes(selectedTag)))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg text-muted-foreground">Loading destination...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Destination not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const filteredPlaces = getFilteredPlaces()
  const allTags = getAllTags()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            {trip.description && <p className="text-sm text-muted-foreground">{trip.description}</p>}
          </div>
        </div>
        <Button onClick={() => setShowPlaceSearch(!showPlaceSearch)}>
          {showPlaceSearch ? "Close Search" : "Add Place"}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showPlaceSearch && (
          <div className="border-b p-4">
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              selectedPlace={selectedPlace}
              onShowDetails={() => setShowPlaceDetails(true)}
              onLocationChange={(location) => setMapCenter({ lat: location.lat, lng: location.lng })}
              trips={[trip]}
              onAddPlaceToTrip={handleAddPlace}
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Places ({filteredPlaces.length}
                  {selectedTags.length > 0 && ` of ${trip.places.length}`})
                </h2>
                {allTags.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="mr-2 size-4" />
                    Filter by Tags
                    {selectedTags.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedTags.length}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>

              {showFilters && allTags.length > 0 && (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Filter by tags:</p>
                      {selectedTags.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>
                          Clear all
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {filteredPlaces.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {trip.places.length === 0
                      ? 'No places added yet. Click "Add Place" to get started!'
                      : "No places match the selected filters."}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPlaces.map((place) => (
                    <Card key={place.id} className="flex overflow-hidden">
                      <div
                        className="w-48 shrink-0 cursor-pointer overflow-hidden"
                        onClick={() => handlePlaceSelect(place)}
                      >
                        <img
                          src={place.photos?.[0] || "/placeholder.svg?height=192&width=192"}
                          alt={place.name}
                          className="size-full object-cover transition-transform hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className="cursor-pointer text-lg font-semibold hover:text-primary"
                              onClick={() => handlePlaceSelect(place)}
                            >
                              {place.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="size-4" />
                              <span>{place.address}</span>
                            </div>
                            {place.rating && (
                              <div className="mt-1 flex items-center gap-1">
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{place.rating}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePlace(place.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        {editingNotes === place.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              defaultValue={place.notes || ""}
                              onBlur={(e) => handleUpdateNotes(place.id, e.target.value)}
                              autoFocus
                              className="min-h-20"
                            />
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">{place.notes || "No notes"}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingNotes(place.id)}
                                className="size-6"
                              >
                                <Edit className="size-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {place.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {place.visitPreference && (
                          <div className="mt-2">
                            <Select
                              value={place.visitPreference}
                              onValueChange={(value) =>
                                handleUpdateVisitPreference(place.id, value as Place["visitPreference"])
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="afternoon">Afternoon</SelectItem>
                                <SelectItem value="evening">Evening</SelectItem>
                                <SelectItem value="night">Night</SelectItem>
                                <SelectItem value="anytime">Anytime</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="h-[500px] overflow-hidden rounded-lg border">
              <GoogleMap
                center={mapCenter}
                selectedPlace={selectedPlace}
                savedPlaces={filteredPlaces}
                onPlaceSelect={handlePlaceSelect}
              />
            </div>
          </div>
        </div>
      </div>

      {showPlaceDetails && selectedPlace && (
        <PlaceDetails
          place={selectedPlace}
          onClose={() => setShowPlaceDetails(false)}
          trips={[trip]}
          onAddPlaceToTrip={handleAddPlace}
          onUpdateImages={handleUpdatePlacePhotos}
          onUpdateWebsite={handleUpdatePlaceWebsite}
        />
      )}
    </div>
  )
}
