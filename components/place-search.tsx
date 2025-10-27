"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, MapPin, Star, Heart, Plus, Globe, Calendar } from "lucide-react"
import type { Place, Trip } from "./travel-planner"

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

      const request: any = {
        query: query + " city",
      }

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

            setCurrentLocation(newLocation)
            onLocationChange?.(newLocation)

            searchPlaces("", selectedType || undefined, newLocation)
          }
        } else {
          console.log("[v0] Location search failed, using fallback")
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

    try {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log("[v0] Google Maps API not loaded yet")
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

      const request: any = {
        query: searchQuery,
      }

      if (location.lat !== 0 && location.lng !== 0) {
        request.location = new window.google.maps.LatLng(location.lat, location.lng)
        request.radius = 50000
      }

      console.log("[v0] Searching places with query:", searchQuery)

      service.textSearch(request, (results, status) => {
        console.log("[v0] Search status:", status)
        console.log("[v0] Search results count:", results?.length || 0)

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places: Place[] = results.slice(0, 10).map((place, index) => ({
            id: place.place_id || `place-${index}`,
            name: place.name || "Unknown Place",
            address: place.formatted_address || "Address not available",
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            type: place.types?.[0],
            rating: place.rating,
            photos: place.photos?.slice(0, 5).map((photo) => photo.getUrl({ maxWidth: 400, maxHeight: 400 })) || [],
            isOpen: place.opening_hours?.isOpen?.(),
          }))

          console.log("[v0] Processed places:", places.length)
          setSearchResults(places)
        } else {
          console.log("[v0] No results found or search failed")
          setSearchResults([])
        }
        setIsLoading(false)
      })
    } catch (error) {
      console.error("[v0] Error searching places:", error)
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            ref={locationInputRef}
            placeholder="Search location (e.g., Paris, Tokyo, London)"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
            className="flex-1"
          />
          <Button onClick={handleLocationSearch} size="icon">
            <Globe className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{currentLocation.name}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PLACE_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={selectedType === type.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeSelect(type.id)}
            className="gap-2"
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          ref={searchInputRef}
          placeholder="Search for places..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {searchResults.map((place) => (
          <Card
            key={place.id}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onPlaceSelect(place)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold truncate">{place.name}</h3>
                  {place.isOpen !== undefined && (
                    <Badge variant={place.isOpen ? "default" : "secondary"} className="flex-shrink-0">
                      {place.isOpen ? "Open" : "Closed"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{place.address}</span>
                </div>

                <div className="flex items-center gap-4">
                  {place.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{place.rating}</span>
                    </div>
                  )}

                  {place.type && (
                    <Badge variant="outline" className="text-xs">
                      {place.type.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  variant={savedPlaceIds.includes(place.id) ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSavePlace(place)
                  }}
                  disabled={savedPlaceIds.includes(place.id)}
                >
                  <Heart className={`h-4 w-4 ${savedPlaceIds.includes(place.id) ? "fill-current" : ""}`} />
                </Button>

                {trips.length > 0 && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTripSelectionPlace(place)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {place.photos && place.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {place.photos.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo || "/placeholder.svg"}
                    alt={`${place.name} ${index + 1}`}
                    className="h-20 w-20 object-cover rounded flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

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
                <Calendar className="h-4 w-4 mr-2" />
                {trip.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
