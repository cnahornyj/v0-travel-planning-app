"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Trash2, Heart, Clock, Phone, Globe } from "lucide-react"
import type { Place } from "./travel-planner"

interface SavedPlacesProps {
  places: Place[]
  onPlaceSelect: (place: Place) => void
  onRemovePlace: (placeId: string) => void
}

export function SavedPlaces({ places, onPlaceSelect, onRemovePlace }: SavedPlacesProps) {
  console.log("[v0] SavedPlaces - First place structure:", places[0])

  const getCurrentOpeningStatus = (place: Place) => {
    if (place.isOpen === undefined) return null
    return place.isOpen
  }

  const getTodaysHours = (place: Place) => {
    if (!place.openingHours?.weekdayText) return null

    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1
    const todayHours = place.openingHours.weekdayText[todayIndex]

    if (todayHours) {
      return todayHours.replace(/^[^:]+:\s*/, "")
    }
    return null
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="mb-4 size-12 text-muted-foreground" />
        <p className="text-lg font-medium">No saved places yet</p>
        <p className="text-sm text-muted-foreground">Start exploring and save places you want to visit!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Travel List</h2>
        <Badge variant="secondary">
          {places.length} place{places.length !== 1 ? "s" : ""} saved
        </Badge>
      </div>

      <div className="space-y-2">
        {places.map((place) => {
          const isOpen = getCurrentOpeningStatus(place)
          const todaysHours = getTodaysHours(place)

          return (
            <Card
              key={place.id}
              className="cursor-pointer p-4 transition-all hover:shadow-md"
              onClick={() => onPlaceSelect(place)}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {place.photos?.[0] && (
                    <img
                      src={place.photos[0] || "/placeholder.svg"}
                      alt={place.name}
                      className="size-16 rounded object-cover"
                    />
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold leading-tight">{place.name}</h3>
                      {isOpen !== null && (
                        <Badge variant={isOpen ? "default" : "secondary"} className="ml-2">
                          {isOpen ? "Open" : "Closed"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 flex-shrink-0 mt-0.5" />
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

                    {todaysHours && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        <span>Today: {todaysHours}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm">
                      {place.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="size-3" />
                          <span>{place.phone}</span>
                        </div>
                      )}

                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="size-3" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log("[v0] Attempting to delete place:", {
                      id: place.id,
                      name: place.name,
                      fullPlace: place,
                    })
                    onRemovePlace(place.id)
                  }}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Remove
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
