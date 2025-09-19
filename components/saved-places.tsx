"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Trash2, Heart } from "lucide-react"
import type { Place } from "./travel-planner"

interface SavedPlacesProps {
  places: Place[]
  onPlaceSelect: (place: Place) => void
  onRemovePlace: (placeId: string) => void
}

export function SavedPlaces({ places, onPlaceSelect, onRemovePlace }: SavedPlacesProps) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No saved places yet</h3>
        <p className="text-muted-foreground text-sm">Start exploring and save places you want to visit!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Your Travel List</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {places.length} place{places.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {places.map((place) => (
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
                {place.type && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs bg-secondary/10 text-secondary rounded-full">
                      {place.type.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemovePlace(place.id)
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
