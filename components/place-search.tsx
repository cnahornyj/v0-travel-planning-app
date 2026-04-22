"use client"

import { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, MapPin, Star, Plus, Globe, Calendar, PlusCircle, Info } from "lucide-react"
import { TravelSpinner } from "@/components/ui/travel-spinner"
import type { Place, Trip } from "./travel-planner"

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  onLocationChange?: (location: { lat: number; lng: number; name: string }) => void
  selectedPlace?: Place | null
  onShowDetails?: () => void
  trips?: Trip[]
  onAddPlaceToTrip?: (tripId: string, place: Place) => void
}

const PLACE_TYPES = [
  { id: "restaurant", label: "Restaurants", icon: "🍽️" },
  { id: "tourist_attraction", label: "Attractions", icon: "🎯" },
  { id: "lodging", label: "Hotels", icon: "🏨" },
  { id: "museum", label: "Museums", icon: "🏛️" },
  { id: "park", label: "Parks", icon: "🌳" },
  { id: "shopping_mall", label: "Shopping", icon: "🛍️" },
]

// Helper to get the PlacesService (client-side, requires google maps JS loaded)
function getPlacesService(): any | null {
  if (typeof window === "undefined" || !window.google?.maps?.places) return null
  const div = document.createElement("div")
  return new window.google.maps.places.PlacesService(div)
}

// Convert a Google PlaceResult to our Place type
function placeResultToPlace(result: any): Place {
  return {
    id: result.place_id || `place-${Math.random().toString(36).slice(2)}`,
    name: result.name || "Unknown Place",
    address: result.formatted_address || result.vicinity || "Address not available",
    lat: result.geometry?.location?.lat() || 0,
    lng: result.geometry?.location?.lng() || 0,
    type: result.types?.[0],
    rating: result.rating,
    photos: result.photos
      ? result.photos.slice(0, 5).map((photo: any) => photo.getUrl({ maxWidth: 400 }))
      : [],
    isOpen: result.opening_hours?.isOpen?.(),
  }
}

export function PlaceSearch({
  onPlaceSelect,
  onLocationChange,
  selectedPlace,
  onShowDetails,
  trips = [],
  onAddPlaceToTrip,
}: PlaceSearchProps) {
  const [manualName, setManualName] = useState("")
  const [manualAddress, setManualAddress] = useState("")
  const [manualNotes, setManualNotes] = useState("")
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")
  const [isManualLoading, setIsManualLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 40.7128,
    lng: -74.006,
    name: "New York, NY",
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const [tripSelectionPlace, setTripSelectionPlace] = useState<Place | null>(null)

  // Client-side text search using the Google Maps JS SDK
  const clientTextSearch = useCallback(
    (query: string, location?: { lat: number; lng: number }): Promise<Place[]> => {
      return new Promise((resolve) => {
        const service = getPlacesService()
        if (!service) {
          console.error("[v0] Google Maps PlacesService not available")
          resolve([])
          return
        }

        const request: any = {
          query,
          ...(location && location.lat !== 0 && location.lng !== 0
            ? {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: 50000,
              }
            : {}),
        }

        service.textSearch(request, (results: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results.slice(0, 10).map((r) => placeResultToPlace(r)))
          } else {
            resolve([])
          }
        })
      })
    },
    []
  )

  const searchLocation = async (query: string) => {
    if (!query.trim()) return

    try {
      const results = await clientTextSearch(query + " city")

      if (results.length > 0) {
        const place = results[0]
        const newLocation = {
          lat: place.lat,
          lng: place.lng,
          name: place.address || place.name || query,
        }

        setCurrentLocation(newLocation)
        onLocationChange?.(newLocation)
        searchPlaces("", selectedType || undefined, newLocation)
      } else {
        const fallbackLocation = { lat: 0, lng: 0, name: query }
        setCurrentLocation(fallbackLocation)
        onLocationChange?.(fallbackLocation)
        searchPlaces(query + " attractions", selectedType || undefined, fallbackLocation)
      }
    } catch (error) {
      console.error("[v0] Error searching location:", error)
    }
  }

  const searchPlaces = async (query: string, type?: string, location = currentLocation) => {
    setIsLoading(true)

    try {
      let finalQuery = query
      if (!finalQuery) {
        if (type) {
          const typeLabel = PLACE_TYPES.find((t) => t.id === type)?.label || type
          finalQuery = `${typeLabel} in ${location.name}`
        } else {
          finalQuery = `popular places in ${location.name}`
        }
      } else if (location.name && location.name !== "New York, NY") {
        finalQuery = `${query} in ${location.name}`
      }

      const results = await clientTextSearch(finalQuery, { lat: location.lat, lng: location.lng })
      setSearchResults(results)
    } catch (error) {
      console.error("[v0] Error searching places:", error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    searchPlaces(searchQuery, selectedType || undefined)
  }

  const handleLocationSearch = () => {
    searchLocation(locationQuery)
  }

  const handleTypeSelect = (typeId: string) => {
    const newType = selectedType === typeId ? null : typeId
    setSelectedType(newType)
    searchPlaces(searchQuery, newType || undefined)
  }

  const handleManualAdd = async () => {
    if (!manualName.trim() || !manualAddress.trim()) return

    setIsManualLoading(true)
    try {
      // Use manually entered coordinates if provided, otherwise fall back to current location
      const lat = manualLat.trim() ? parseFloat(manualLat.trim()) : (currentLocation.lat || 0)
      const lng = manualLng.trim() ? parseFloat(manualLng.trim()) : (currentLocation.lng || 0)

      const manualPlace: Place = {
        id: `manual-${Date.now()}`,
        name: manualName.trim(),
        address: manualAddress.trim(),
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng,
        notes: manualNotes.trim() || undefined,
        saved: true,
      }

      if (onAddPlaceToTrip) {
        onAddPlaceToTrip("default-trip-id", manualPlace)
      }

      setManualName("")
      setManualAddress("")
      setManualNotes("")
      setManualLat("")
      setManualLng("")

      // Center the map on the new place if coordinates were provided
      if (manualLat.trim() && manualLng.trim() && !isNaN(lat) && !isNaN(lng)) {
        onLocationChange?.({ lat, lng, name: manualPlace.name })
      }

      onPlaceSelect(manualPlace)
    } catch (error) {
      console.error("[v0] Error adding manual place:", error)
    } finally {
      setIsManualLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">
            <Search className="mr-2 size-4" />
            Search Maps
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Plus className="mr-2 size-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={locationInputRef}
                type="text"
                placeholder="Search location (e.g., Tokyo)"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleLocationSearch} variant="outline">
              <Globe className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span className="text-sm font-medium">{currentLocation.name}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PLACE_TYPES.map((type) => (
              <Badge
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTypeSelect(type.id)}
              >
                {type.icon}
                {type.label}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <TravelSpinner size="md" message="Searching places..." />
            </div>
          )}

          <div className="space-y-3">
            {searchResults.map((place) => (
              <Card
                key={place.id}
                className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
                onClick={() => onPlaceSelect(place)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{place.name}</h4>
                      {place.isOpen !== undefined && (
                        <Badge variant={place.isOpen ? "default" : "secondary"} className="mt-1">
                          {place.isOpen ? "Open" : "Closed"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {trips.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTripSelectionPlace(place)
                          }}
                        >
                          <PlusCircle className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="line-clamp-1">{place.address}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {place.rating && (
                      <Badge variant="secondary">
                        <Star className="mr-1 size-3 fill-yellow-400 text-yellow-400" />
                        {place.rating}
                      </Badge>
                    )}

                    {place.type && (
                      <Badge variant="outline" className="capitalize">
                        {place.type.replace("_", " ")}
                      </Badge>
                    )}
                  </div>

                  {place.photos && place.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {place.photos.slice(0, 3).map((photo, index) => (
                        <img
                          key={index}
                          src={photo || "/placeholder.svg"}
                          alt={`${place.name} ${index + 1}`}
                          className="size-20 rounded object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              {"Can't find your place on Google Maps? Add it manually with the address you have."}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-name">Place Name *</Label>
              <Input
                id="manual-name"
                placeholder="e.g., Secret Garden Cafe"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-address">Address *</Label>
              <Input
                id="manual-address"
                placeholder="e.g., 123 Main St, Tokyo, Japan"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-lat">Latitude (optional)</Label>
                <Input
                  id="manual-lat"
                  placeholder="e.g., 35.6762"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-lng">Longitude (optional)</Label>
                <Input
                  id="manual-lng"
                  placeholder="e.g., 139.6503"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-notes">Notes (optional)</Label>
              <Textarea
                id="manual-notes"
                placeholder="Any additional details..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleManualAdd} disabled={!manualName.trim() || !manualAddress.trim() || isManualLoading} className="w-full">
              {isManualLoading ? (
                <>
                  <svg
                    className="mr-2 size-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Adding Place...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Add Place
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!tripSelectionPlace} onOpenChange={() => setTripSelectionPlace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Trip</DialogTitle>
            <DialogDescription>Select a trip to add {tripSelectionPlace?.name} to</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {trips.map((trip) => (
              <Button
                key={trip.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (tripSelectionPlace && onAddPlaceToTrip) {
                    onAddPlaceToTrip(trip.id, tripSelectionPlace)
                    setTripSelectionPlace(null)
                  }
                }}
              >
                <Calendar className="mr-2 size-4" />
                {trip.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
