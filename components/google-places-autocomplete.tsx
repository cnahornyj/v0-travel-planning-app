"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Place } from "@/app/page"
import { Loader2, MapPin } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { google } from "google-maps"

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: Place) => void
}

export function GooglePlacesAutocomplete({ onPlaceSelect }: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState("")
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string
    address: string
    placeId: string
    lat?: number
    lng?: number
  } | null>(null)
  const [notes, setNotes] = useState("")

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService()

      const div = document.createElement("div")
      placesService.current = new window.google.maps.places.PlacesService(div)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setInputValue(value)

    if (!value || !autocompleteService.current) {
      setPredictions([])
      return
    }

    setIsLoading(true)
    autocompleteService.current.getPlacePredictions({ input: value }, (results, status) => {
      setIsLoading(false)
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results)
      } else {
        setPredictions([])
      }
    })
  }

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return

    setIsLoading(true)
    placesService.current.getDetails({ placeId: prediction.place_id }, (place, status) => {
      setIsLoading(false)
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        setSelectedPlace({
          name: place.name || prediction.structured_formatting.main_text,
          address: place.formatted_address || prediction.description,
          placeId: prediction.place_id,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        })
        setInputValue(place.name || prediction.structured_formatting.main_text)
        setPredictions([])
      }
    })
  }

  const handleAddPlace = () => {
    if (selectedPlace) {
      onPlaceSelect({
        id: Date.now().toString(),
        name: selectedPlace.name,
        address: selectedPlace.address,
        placeId: selectedPlace.placeId,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        notes: notes || undefined,
      })

      // Reset form
      setInputValue("")
      setSelectedPlace(null)
      setNotes("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="google-search">Search for a place</Label>
        <div className="relative">
          <Input
            id="google-search"
            placeholder="Search for restaurants, hotels, attractions..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {predictions.length > 0 && (
          <div className="rounded-md border border-border bg-card shadow-md">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelectPrediction(prediction)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{prediction.structured_formatting.main_text}</p>
                  <p className="text-xs text-muted-foreground">{prediction.structured_formatting.secondary_text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <>
          <div className="rounded-lg border border-border bg-secondary p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-secondary-foreground" />
              <div className="flex-1">
                <p className="font-medium text-secondary-foreground">{selectedPlace.name}</p>
                <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this place..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleAddPlace}>Add Place</Button>
          </div>
        </>
      )}
    </div>
  )
}
