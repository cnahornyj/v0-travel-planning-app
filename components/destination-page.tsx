"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GoogleMap } from "./google-map"
import { PlaceSearch } from "./place-search"
import { PlaceDetails } from "./place-details"
import { ArrowLeft, Trash2, MapPin, Star, Edit, Filter, Info, Calendar, CalendarPlus } from "lucide-react"
import type { Trip, Place, ScheduledEvent } from "./travel-planner"
import { ScheduleSidebar } from "./schedule-sidebar"
import { EventDialog } from "./event-dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.006,
  })
  const [showScheduleSidebar, setShowScheduleSidebar] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [eventDialogInitialDate, setEventDialogInitialDate] = useState<string | undefined>()
  const [eventDialogInitialPlaceId, setEventDialogInitialPlaceId] = useState<string | undefined>()
  const [eventDialogInitialStartTime, setEventDialogInitialStartTime] = useState<string | undefined>()

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

    console.log("[v0] handleAddPlace called with place:", place)
    console.log("[v0] Place data - name:", place.name, "address:", place.address, "photos:", place.photos?.length)

    const updatedPlaces = [...trip.places, place]
    await updateTrip({ places: updatedPlaces })
    setShowPlaceSearch(false)
  }

  const handleRemovePlace = async (placeId: string) => {
    if (!trip) return

    const updatedPlaces = trip.places.filter((p) => p.id !== placeId)
    await updateTrip({ places: updatedPlaces })
    setPlaceToDelete(null)
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

  const handleUpdateOpeningHours = async (placeId: string, weekdayText: string[]) => {
    if (!trip) return

    const updatedPlaces = trip.places.map((p) =>
      p.id === placeId ? { ...p, openingHours: { ...p.openingHours, weekdayText } } : p,
    )
    await updateTrip({ places: updatedPlaces })

    if (selectedPlace?.id === placeId) {
      setSelectedPlace((prev) => (prev ? { ...prev, openingHours: { ...prev.openingHours, weekdayText } } : null))
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

  const handleAddScheduledEvent = async (event: Omit<ScheduledEvent, "id">) => {
    if (!trip) return

    const newEvent: ScheduledEvent = {
      ...event,
      id: crypto.randomUUID(),
    }

    const updatedEvents = [...(trip.scheduledEvents || []), newEvent]
    await updateTrip({ scheduledEvents: updatedEvents })
  }

  const handleRemoveScheduledEvent = async (eventId: string) => {
    if (!trip) return

    const updatedEvents = (trip.scheduledEvents || []).filter((e) => e.id !== eventId)
    await updateTrip({ scheduledEvents: updatedEvents })
  }

  const handleOpenEventDialog = (date?: string, placeId?: string, startTime?: string) => {
    setEventDialogInitialDate(date)
    setEventDialogInitialPlaceId(placeId)
    setEventDialogInitialStartTime(startTime)
    setShowEventDialog(true)
  }

  const handleScheduleFromPlaceCard = (placeId: string) => {
    handleOpenEventDialog(undefined, placeId)
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

  const confirmDelete = (place: Place) => {
    setPlaceToDelete(place)
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
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
        <div className="flex items-center gap-2">
          <Button
            variant={showScheduleSidebar ? "default" : "outline"}
            onClick={() => setShowScheduleSidebar(!showScheduleSidebar)}
          >
            <Calendar className="mr-2 size-4" />
            Schedule
            {(trip.scheduledEvents?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {trip.scheduledEvents?.length}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setShowPlaceSearch(!showPlaceSearch)}>
            {showPlaceSearch ? "Close Search" : "Add Place"}
          </Button>
        </div>
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
              onAddPlaceToTrip={(tripId, place) => handleAddPlace(place)}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredPlaces.map((place) => (
                    <Card
                      key={place.id}
                      className="group flex h-44 flex-row gap-0 overflow-hidden p-3 py-3 transition-shadow hover:shadow-lg"
                    >
                      <div className="relative h-full w-36 shrink-0 overflow-hidden rounded-xl">
                        <img
                          src={place.photos?.[0] || "/placeholder.svg?height=300&width=300"}
                          alt={place.name}
                          className="size-full object-cover"
                        />
                      </div>

                      <div className="ml-4 flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-base font-bold">{place.name}</h3>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleScheduleFromPlaceCard(place.id)}
                              className="size-7"
                              title="Add to schedule"
                            >
                              <CalendarPlus className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePlaceSelect(place)}
                              className="size-7"
                            >
                              <Info className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(place)}
                              className="size-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {place.rating && (
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{place.rating}</span>
                          </div>
                        )}

                        <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 size-3 shrink-0" />
                          <span className="line-clamp-1">{place.address}</span>
                        </div>

                        {editingNotes === place.id ? (
                          <Textarea
                            defaultValue={place.notes || ""}
                            onBlur={(e) => handleUpdateNotes(place.id, e.target.value)}
                            autoFocus
                            className="mt-1 min-h-14 text-xs"
                          />
                        ) : (
                          <div className="mt-1 flex items-start gap-1">
                            <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">
                              {place.notes || "Aucune note"}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingNotes(place.id)}
                              className="size-5 shrink-0"
                            >
                              <Edit className="size-3" />
                            </Button>
                          </div>
                        )}

                        {place.tags && place.tags.length > 0 && (
                          <div className="mt-auto flex flex-wrap gap-1 pt-1">
                            {place.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                            {place.tags.length > 3 && (
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                +{place.tags.length - 3}
                              </Badge>
                            )}
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

        <Dialog open={!!placeToDelete} onOpenChange={() => setPlaceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le lieu <strong>{placeToDelete?.name}</strong> de votre destination ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlaceToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => placeToDelete && handleRemovePlace(placeToDelete.id)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{showPlaceDetails && selectedPlace && (
          <PlaceDetails
            place={selectedPlace}
            onClose={() => setShowPlaceDetails(false)}
            trips={[trip]}
            onAddPlaceToTrip={handleAddPlace}
            onUpdateImages={handleUpdatePlacePhotos}
            onUpdateWebsite={handleUpdatePlaceWebsite}
            onUpdateOpeningHours={handleUpdateOpeningHours}
            onUpdateTags={handleUpdateTags}
          />
        )}
      </div>

      {/* Schedule Sidebar */}
      <ScheduleSidebar
        isOpen={showScheduleSidebar}
        onClose={() => setShowScheduleSidebar(false)}
        places={trip.places}
        scheduledEvents={trip.scheduledEvents || []}
        onAddEvent={handleAddScheduledEvent}
        onRemoveEvent={handleRemoveScheduledEvent}
        onOpenEventDialog={handleOpenEventDialog}
      />

      {/* Event Creation Dialog */}
      <EventDialog
        isOpen={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        places={trip.places}
        onSave={handleAddScheduledEvent}
        initialDate={eventDialogInitialDate}
        initialPlaceId={eventDialogInitialPlaceId}
        initialStartTime={eventDialogInitialStartTime}
      />
    </div>
  )
}
