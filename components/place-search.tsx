"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, MapPin, Star, Heart, Plus, Globe, Calendar } from "lucide-react"
import type { Place, Trip } from "./travel-planner"
import type { google } from "google-maps"

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  onSavePlace: (place: Place) => void
  savedPlaceIds: string[]
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

export function PlaceSearch({
  onPlaceSelect,
  onSavePlace,
  savedPlaceIds,
  onLocationChange,
  selectedPlace,
  onShowDetails,
  trips = [],
  onAddPlaceToTrip,
}: PlaceSearchProps) {
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

  const searchLocation = async (query: string) => {
    if (!query.trim()) return

    try {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log("[v0] Google Maps API not loaded yet")
        return
      }

      const service = new window.google.maps.places.PlacesService(document.createElement("div"))

      const request: google.maps.places.TextSearchRequest = {
        query: query + " city",
        type: "locality" as any,
      }

      console.log("[v0] Searching for location:", query)

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0]
          const location = place.geometry?.location

          if (location) {
            const newLocation = {
              lat: location.lat(),
              lng: location.lng(),
              name: place.formatted_address || place.name || query,
            }

            console.log("[v0] Found location:", newLocation)
            setCurrentLocation(newLocation)
            onLocationChange?.(newLocation)

            searchPlaces("", selectedType || undefined, newLocation)
          }
        } else {
          console.log("[v0] Location search failed:", status)
          const fallbackLocation = {
            lat: 0,
            lng: 0,
            name: query,
          }
          setCurrentLocation(fallbackLocation)
          onLocationChange?.(fallbackLocation)

          searchPlaces(query + " attractions", selectedType || undefined, fallbackLocation)
        }
      })
    } catch (error) {
      console.error("[v0] Error searching location:", error)
    }
  }

  const searchPlaces = async (query: string, type?: string, location = currentLocation) => {
    setIsLoading(true)
    console.log("[v0] Starting place search with query:", query, "type:", type, "location:", location)

    try {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log("[v0] Google Places API not loaded yet")
        setIsLoading(false)
        return
      }

      const service = new window.google.maps.places.PlacesService(document.createElement("div"))

      let searchQuery = query
      if (!searchQuery) {
        if (type) {
          const typeLabel = PLACE_TYPES.find((t) => t.id === type)?.label || type
          searchQuery = `${typeLabel} in ${location.name}`
        } else {
          searchQuery = `popular places in ${location.name}`
        }
      } else if (location.name && location.name !== "New York, NY") {
        searchQuery = `${query} in ${location.name}`
      }

      const request: google.maps.places.TextSearchRequest = {
        query: searchQuery,
      }

      if (location.lat !== 0 && location.lng !== 0) {
        request.location = new window.google.maps.LatLng(location.lat, location.lng)
        request.radius = 50000
      }

      if (type) {
        request.type = type as any
      }

      console.log("[v0] Places API request:", request)

      service.textSearch(request, (results, status) => {
        console.log("[v0] Places API response status:", status)

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places: Place[] = results.slice(0, 10).map((place, index) => ({
            id: place.place_id || `place-${index}`,
            name: place.name || "Unknown Place",
            address: place.formatted_address || "Address not available",
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            type: type || "place",
            rating: place.rating,
            photos: place.photos ? [place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 })] : [],
            isOpen: undefined,
          }))

          console.log("[v0] Processed places:", places)
          setSearchResults(places)
        } else {
          console.log("[v0] Places API error:", status)
          setSearchResults([])
        }
        setIsLoading(false)
      })
    } catch (error) {
      console.error("[v0] Error searching places:", error)
      setIsLoading(false)
      setSearchResults([])
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPlaces(searchQuery, selectedType || undefined)
    }
  }

  const handleLocationSearch = () => {
    if (locationQuery.trim()) {
      searchLocation(locationQuery)
    }
  }

  const handleTypeSelect = (type: string) => {
    const newType = selectedType === type ? null : type
    setSelectedType(newType)
    if (searchQuery.trim() || newType) {
      searchPlaces(searchQuery, newType || undefined)
    }
  }

  useEffect(() => {
    const initializeAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("[v0] Google Places API loaded and ready")
      } else {
        console.log("[v0] Waiting for Google Places API to load...")
        setTimeout(initializeAPI, 1000)
      }
    }

    initializeAPI()
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={locationInputRef}
              placeholder="Search city or country..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleLocationSearch} variant="outline" size="sm">
            <Globe className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3 h-3" />
          <span>Searching in: {currentLocation.name}</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search for places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <p className="text-sm font-medium text-foreground mb-3">Browse by category</p>
        <div className="flex flex-wrap gap-2">
          {PLACE_TYPES.map((type) => (
            <Badge
              key={type.id}
              variant={selectedType === type.id ? "default" : "secondary"}
              className="cursor-pointer hover:bg-accent/80 transition-colors"
              onClick={() => handleTypeSelect(type.id)}
            >
              <span className="mr-1">{type.icon}</span>
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {selectedPlace && (
          <Card className="p-4 border-accent/20 bg-accent/5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">{selectedPlace.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedPlace.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  {selectedPlace.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">★</span>
                      <span className="text-sm text-muted-foreground">{selectedPlace.rating}</span>
                    </div>
                  )}
                  {selectedPlace.isOpen !== undefined && (
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${selectedPlace.isOpen ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      <span className="text-xs text-muted-foreground">{selectedPlace.isOpen ? "Open" : "Closed"}</span>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent" onClick={onShowDetails}>
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((place) => (
            <Card
              key={place.id}
              className="p-4 cursor-pointer hover:bg-accent/5 transition-colors border-border/50"
              onClick={() => onPlaceSelect(place)}
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {place.photos?.[0] && (
                    <img
                      src={place.photos[0] || "/placeholder.svg"}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{place.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                  </div>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{place.rating}</span>
                    </div>
                  )}
                  {place.isOpen !== undefined && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs font-medium">{place.isOpen ? "Open" : "Closed"}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {trips.length > 0 && onAddPlaceToTrip && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTripSelectionPlace(place)
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={savedPlaceIds.includes(place.id) ? "secondary" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!savedPlaceIds.includes(place.id)) {
                        onSavePlace(place)
                      }
                    }}
                    disabled={savedPlaceIds.includes(place.id)}
                  >
                    {savedPlaceIds.includes(place.id) ? (
                      <Heart className="w-4 h-4 fill-current" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Search for places to explore</p>
            <p className="text-xs text-muted-foreground mt-1">Enter a city name or search for specific places</p>
          </div>
        )}
      </div>

      <Dialog open={!!tripSelectionPlace} onOpenChange={(open) => !open && setTripSelectionPlace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Trip</DialogTitle>
            <DialogDescription>Choose which trip to add "{tripSelectionPlace?.name}" to.</DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {trips.map((trip) => {
              const isAlreadyInTrip = trip.places.some((p) => p.id === tripSelectionPlace?.id)
              return (
                <Card
                  key={trip.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    isAlreadyInTrip ? "bg-muted/50 cursor-not-allowed" : "hover:bg-accent/5"
                  }`}
                  onClick={() => {
                    if (!isAlreadyInTrip && tripSelectionPlace && onAddPlaceToTrip) {
                      onAddPlaceToTrip(trip.id, tripSelectionPlace)
                      setTripSelectionPlace(null)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{trip.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {trip.places.length} place{trip.places.length !== 1 ? "s" : ""}
                        {trip.startDate && trip.endDate && (
                          <span> • {new Date(trip.startDate).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    {isAlreadyInTrip && (
                      <Badge variant="secondary" className="text-xs">
                        Already added
                      </Badge>
                    )}
                  </div>
                </Card>
              )
            })}
            {trips.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No trips created yet. Create a trip first to add places to it.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
