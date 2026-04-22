"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, MapPin, Star, Plus, Calendar, PlusCircle, Info } from "lucide-react"
import { TravelSpinner } from "@/components/ui/travel-spinner"
import type { Place, Trip } from "./travel-planner"

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  onLocationChange?: (location: { lat: number; lng: number; name: string }) => void
  selectedPlace?: Place | null
  onShowDetails?: () => void
  trips?: Trip[]
  onAddPlaceToTrip?: (tripId: string, place: Place) => void
  destinationName?: string
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
  destinationName,
}: PlaceSearchProps) {
  const [manualName, setManualName] = useState("")
  const [manualAddress, setManualAddress] = useState("")
  const [manualNotes, setManualNotes] = useState("")
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")
  const [isManualLoading, setIsManualLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 0,
    lng: 0,
    name: destinationName || "",
  })
  const [isLocationInitialized, setIsLocationInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
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

  // Auto-initialize location from destination name
  useEffect(() => {
    const initializeLocation = async () => {
      if (!destinationName || isLocationInitialized || isInitializing) return
      
      setIsInitializing(true)
      try {
        const results = await clientTextSearch(destinationName + " city")
        if (results.length > 0) {
          const place = results[0]
          const newLocation = {
            lat: place.lat,
            lng: place.lng,
            name: destinationName,
          }
          setCurrentLocation(newLocation)
          onLocationChange?.(newLocation)
        } else {
          setCurrentLocation({ lat: 0, lng: 0, name: destinationName })
        }
      } catch (error) {
        console.error("[v0] Error initializing location:", error)
        setCurrentLocation({ lat: 0, lng: 0, name: destinationName })
      } finally {
        setIsLocationInitialized(true)
        setIsInitializing(false)
      }
    }

    initializeLocation()
  }, [destinationName, isLocationInitialized, isInitializing, clientTextSearch, onLocationChange])

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
      } else if (location.name) {
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
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">
            <Search className="mr-2 size-4" />
            Search Maps
          </TabsTrigger>
          <TabsTrigger value="manual">
            <PlusCircle className="mr-2 size-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4 space-y-4">
          {isInitializing ? (
            <div className="flex items-center justify-center py-4">
              <TravelSpinner size="sm" message={`Loading ${destinationName}...`} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <MapPin className="size-4 text-primary" />
                <span className="text-sm font-medium">Searching in: {currentLocation.name || destinationName}</span>
              </div>

              <div className="flex flex-wrap gap-2">
            {PLACE_TYPES.map((type) => (
              <Badge
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                className="cursor-pointer gap-2"
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
              placeholder="Search for places (e.g., museums, restaurants)"
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
            <div className="flex items-center justify-center py-8">
              <TravelSpinner size="sm" message="Searching..." />
            </div>
          )}

          <div className="space-y-2">
            {searchResults.map((place) => (
              <Card
                key={place.id}
                className="cursor-pointer p-4 transition-all hover:shadow-md"
                onClick={() => onPlaceSelect(place)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold leading-tight">{place.name}</h3>
                      {place.isOpen !== undefined && (
                        <Badge variant={place.isOpen ? "default" : "secondary"} className="mt-1">
                          {place.isOpen ? "Open" : "Closed"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {trips.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTripSelectionPlace(place)
                          }}
                        >
                          <Plus className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{place.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{place.rating}</span>
                      </div>
                    )}

                    {place.type && (
                      <Badge variant="outline" className="text-xs">
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
            </>
          )}
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
                placeholder="e.g., Yuen Shinjuku Onsen"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-address">Address *</Label>
              <Input
                id="manual-address"
                placeholder="e.g., 1-1 Kabukicho, Shinjuku City, Tokyo"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-lat">Latitude (optional)</Label>
                <Input
                  id="manual-lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 35.6895"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-lng">Longitude (optional)</Label>
                <Input
                  id="manual-lng"
                  type="number"
                  step="any"
                  placeholder="e.g., 139.6917"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-notes">Notes (optional)</Label>
              <Textarea
                id="manual-notes"
                placeholder="Add any additional information about this place..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleManualAdd}
              className="w-full"
              disabled={isManualLoading || !manualName.trim() || !manualAddress.trim()}
            >
              {isManualLoading ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="mr-2 size-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="3" className="fill-current/20" />
                    <path d="M12 2L12 6" strokeLinecap="round" />
                    <path d="M12 18L12 22" strokeLinecap="round" />
                    <path d="M2 12L6 12" strokeLinecap="round" />
                    <path d="M18 12L22 12" strokeLinecap="round" />
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
                className="w-full justify-start bg-transparent"
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
