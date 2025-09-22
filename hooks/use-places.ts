"use client"

import { useCallback } from "react"
import { useApi, apiRequest } from "./use-api"
import type { Place } from "@/components/travel-planner"

export function usePlaces() {
  const { data: places, loading, error, mutate, refetch, isAuthenticated } = useApi<Place[]>("/api/places", [])

  const savePlace = useCallback(
    async (place: Place) => {
      if (!isAuthenticated) return

      try {
        const savedPlace = await apiRequest("/api/places", {
          method: "POST",
          body: JSON.stringify({
            googlePlaceId: place.id,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            type: place.type,
            rating: place.rating,
            photos: place.photos,
            userImages: place.userImages,
            notes: place.notes,
            tags: place.tags,
            visitPreference: place.visitPreference,
            phone: place.phone,
            website: place.website,
            openingHours: place.openingHours,
            isOpen: place.isOpen,
            priceLevel: place.priceLevel,
            reviews: place.reviews,
          }),
        })

        // Convert MongoDB document to frontend format
        const formattedPlace: Place = {
          id: savedPlace.googlePlaceId,
          name: savedPlace.name,
          address: savedPlace.address,
          lat: savedPlace.location.coordinates[1],
          lng: savedPlace.location.coordinates[0],
          type: savedPlace.type,
          rating: savedPlace.rating,
          photos: savedPlace.photos,
          userImages: savedPlace.userImages,
          saved: true,
          notes: savedPlace.notes,
          tags: savedPlace.tags,
          visitPreference: savedPlace.visitPreference,
          phone: savedPlace.phone,
          website: savedPlace.website,
          openingHours: savedPlace.openingHours,
          isOpen: savedPlace.isOpen,
          priceLevel: savedPlace.priceLevel,
          reviews: savedPlace.reviews,
        }

        mutate([...(places || []), formattedPlace])
        return formattedPlace
      } catch (error) {
        console.error("Error saving place:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, places],
  )

  const removePlace = useCallback(
    async (placeId: string) => {
      if (!isAuthenticated) return

      try {
        // Find the place to get its MongoDB ID
        const place = places?.find((p) => p.id === placeId)
        if (!place) return

        await apiRequest(`/api/places/${place.id}`, {
          method: "DELETE",
        })

        mutate((places || []).filter((p) => p.id !== placeId))
      } catch (error) {
        console.error("Error removing place:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, places],
  )

  const updatePlaceImages = useCallback(
    async (placeId: string, userImages: string[]) => {
      if (!isAuthenticated) return

      try {
        const place = places?.find((p) => p.id === placeId)
        if (!place) return

        await apiRequest(`/api/places/${place.id}`, {
          method: "PUT",
          body: JSON.stringify({ userImages }),
        })

        mutate((places || []).map((p) => (p.id === placeId ? { ...p, userImages } : p)))
      } catch (error) {
        console.error("Error updating place images:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, places],
  )

  return {
    places: places || [],
    loading,
    error,
    savePlace,
    removePlace,
    updatePlaceImages,
    refetch,
    isAuthenticated,
  }
}
