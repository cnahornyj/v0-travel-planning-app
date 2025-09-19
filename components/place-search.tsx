"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Star, Heart, Plus } from "lucide-react"
import type { Place } from "./travel-planner"
import type { google } from "google-maps"

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void
  onSavePlace: (place: Place) => void
  savedPlaceIds: string[]
}

const PLACE_TYPES = [
  { id: "restaurant", label: "Restaurants", icon: "🍽️" },
  { id: "tourist_attraction", label: "Attractions", icon: "🎯" },
  { id: "lodging", label: "Hotels", icon: "🏨" },
  { id: "museum", label: "Museums", icon: "🏛️" },
  { id: "park", label: "Parks", icon: "🌳" },
  { id: "shopping_mall", label: "Shopping", icon: "🛍️" },
]

export function PlaceSearch({ onPlaceSelect, onSavePlace, savedPlaceIds }: PlaceSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const searchPlaces = async (query: string, type?: string) => {
    setIsLoading(true)
    console.log("[v0] Starting place search with query:", query, "type:", type)

    try {
      // Check if Google Maps is loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log("[v0] Google Maps Places API not loaded yet")
        setIsLoading(false)
        return
      }

      const service = new window.google.maps.places.PlacesService(document.createElement("div"))

      // Build search request
      const request: google.maps.places.TextSearchRequest = {
        query: query || (type ? PLACE_TYPES.find((t) => t.id === type)?.label || type : "popular places"),
        location: new window.google.maps.LatLng(40.7128, -74.006), // Default to NYC
        radius: 50000, // 50km radius
      }

      // Add type filter if specified
      if (type) {
        request.type = type as any
      }

      console.log("[v0] Places API request:", request)

      service.textSearch(request, (results, status) => {
        console.log("[v0] Places API response status:", status)
        console.log("[v0] Places API results:", results)

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

  const handleTypeSelect = (type: string) => {
    const newType = selectedType === type ? null : type
    setSelectedType(newType)
    searchPlaces(searchQuery, newType || undefined)
  }

  useEffect(() => {
    const initializeSearch = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("[v0] Google Places API loaded, performing initial search")
        searchPlaces("")
      } else {
        console.log("[v0] Waiting for Google Places API to load...")
        setTimeout(initializeSearch, 1000)
      }
    }

    initializeSearch()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-border">
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

      {/* Place Type Filters */}
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

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                </div>
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
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No places found</p>
            <p className="text-xs text-muted-foreground mt-1">Try searching for a different location or category</p>
          </div>
        )}
      </div>
    </div>
  )
}
