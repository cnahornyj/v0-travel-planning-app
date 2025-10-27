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
        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved places yet</h3>
        <p className="text-muted-foreground">Start exploring and save places you want to visit!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Travel List</h2>
        <Badge variant="secondary">
          {places.length} place{places.length !== 1 ? "s" : ""} saved
        </Badge>
      </div>

      <div className="space-y-3">
        {places.map((place) => {
          const isOpen = getCurrentOpeningStatus(place)
          const todaysHours = getTodaysHours(place)

          return (
            <Card
              key={place.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onPlaceSelect(place)}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {place.photos?.[0] && (
                    <img
                      src={place.photos[0] || "/placeholder.svg"}
                      alt={place.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{place.name}</h3>
                    {isOpen !== null && (
                      <Badge variant={isOpen ? "default" : "secondary"} className="flex-shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {isOpen ? "Open" : "Closed"}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
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

                  {todaysHours && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Today: {todaysHours}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {place.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
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
                        <Globe className="h-3 w-3" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemovePlace(place.id)
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
