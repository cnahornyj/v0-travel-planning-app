"use client"

import { useState, useRef } from "react"
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

  const searchLocation = async (query: string) => {
    if (!query.trim()) return

    try {
      const res = await fetch(`/api/places/search?query=${encodeURIComponent(query + " city")}`)
      const data = await res.json()

      if (data.places && data.places.length > 0) {
        const place = data.places[0]
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

      const params = new URLSearchParams({ query: searchQuery })
      if (location.lat !== 0 && location.lng !== 0) {
        params.set("lat", location.lat.toString())
        params.set("lng", location.lng.toString())
      }

      const res = await fetch(`/api/places/search?${params.toString()}`)
      const data = await res.json()

      if (data.places) {
        setSearchResults(data.places)
      } else {
        setSearchResults([])
      }
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
      const manualPlace: Place = {
        id: `manual-${Date.now()}`,
        name: manualName.trim(),
        address: manualAddress.trim(),
        lat: currentLocation.lat || 0,
        lng: currentLocation.lng || 0,
        notes: manualNotes.trim() || undefined,
        saved: true,
      }

      if (onAddPlaceToTrip) {
        onAddPlaceToTrip("default-trip-id", manualPlace)
      }

      setManualName("")
      setManualAddress("")
      setManualNotes("")

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
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
