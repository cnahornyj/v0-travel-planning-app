"use client"

import { useCallback } from "react"
import { useApi, apiRequest } from "./use-api"
import type { Trip, Place } from "@/components/travel-planner"

export function useTrips() {
  const { data: trips, loading, error, mutate, refetch, isAuthenticated } = useApi<Trip[]>("/api/trips", [])

  const formatTripFromAPI = (apiTrip: any): Trip => ({
    id: apiTrip._id,
    name: apiTrip.name,
    description: apiTrip.description,
    startDate: apiTrip.startDate ? new Date(apiTrip.startDate).toISOString().split("T")[0] : undefined,
    endDate: apiTrip.endDate ? new Date(apiTrip.endDate).toISOString().split("T")[0] : undefined,
    places: (apiTrip.places || []).map((place: any) => ({
      id: place.googlePlaceId,
      name: place.name,
      address: place.address,
      lat: place.location.coordinates[1],
      lng: place.location.coordinates[0],
      type: place.type,
      rating: place.rating,
      photos: place.photos,
      userImages: place.userImages,
      saved: true,
      notes: place.notes,
      tags: place.tags,
      visitPreference: place.visitPreference,
      phone: place.phone,
      website: place.website,
      openingHours: place.openingHours,
      isOpen: place.isOpen,
      priceLevel: place.priceLevel,
      reviews: place.reviews,
    })),
    createdAt: apiTrip.createdAt,
  })

  const createTrip = useCallback(
    async (tripData: Omit<Trip, "id" | "createdAt">) => {
      if (!isAuthenticated) return

      try {
        const newTrip = await apiRequest("/api/trips", {
          method: "POST",
          body: JSON.stringify({
            name: tripData.name,
            description: tripData.description,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            places: [],
          }),
        })

        const formattedTrip = formatTripFromAPI(newTrip)
        mutate([...(trips || []), formattedTrip])
        return formattedTrip
      } catch (error) {
        console.error("Error creating trip:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, trips],
  )

  const updateTrip = useCallback(
    async (tripId: string, updates: Partial<Trip>) => {
      if (!isAuthenticated) return

      try {
        const updatedTrip = await apiRequest(`/api/trips/${tripId}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        })

        const formattedTrip = formatTripFromAPI(updatedTrip)
        mutate((trips || []).map((trip) => (trip.id === tripId ? formattedTrip : trip)))
        return formattedTrip
      } catch (error) {
        console.error("Error updating trip:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, trips],
  )

  const deleteTrip = useCallback(
    async (tripId: string) => {
      if (!isAuthenticated) return

      try {
        await apiRequest(`/api/trips/${tripId}`, {
          method: "DELETE",
        })

        mutate((trips || []).filter((trip) => trip.id !== tripId))
      } catch (error) {
        console.error("Error deleting trip:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, trips],
  )

  const addPlaceToTrip = useCallback(
    async (tripId: string, place: Place) => {
      if (!isAuthenticated) return

      try {
        const updatedTrip = await apiRequest(`/api/trips/${tripId}/places`, {
          method: "POST",
          body: JSON.stringify({ placeData: place }),
        })

        const formattedTrip = formatTripFromAPI(updatedTrip)
        mutate((trips || []).map((trip) => (trip.id === tripId ? formattedTrip : trip)))
        return formattedTrip
      } catch (error) {
        console.error("Error adding place to trip:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, trips],
  )

  const removePlaceFromTrip = useCallback(
    async (tripId: string, placeId: string) => {
      if (!isAuthenticated) return

      try {
        const updatedTrip = await apiRequest(`/api/trips/${tripId}/places?placeId=${placeId}`, {
          method: "DELETE",
        })

        const formattedTrip = formatTripFromAPI(updatedTrip)
        mutate((trips || []).map((trip) => (trip.id === tripId ? formattedTrip : trip)))
        return formattedTrip
      } catch (error) {
        console.error("Error removing place from trip:", error)
        throw error
      }
    },
    [isAuthenticated, mutate, trips],
  )

  return {
    trips: trips || [],
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    addPlaceToTrip,
    removePlaceFromTrip,
    refetch,
    isAuthenticated,
  }
}
