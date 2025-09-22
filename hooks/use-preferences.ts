"use client"

import { useCallback } from "react"
import { useApi, apiRequest } from "./use-api"

interface UserPreferences {
  mapCenter: { lat: number; lng: number }
  activeTab: "search" | "saved" | "trips"
  preferences: {
    defaultTravelMode?: "driving" | "walking" | "transit" | "bicycling"
    units?: "metric" | "imperial"
    language?: string
  }
}

const defaultPreferences: UserPreferences = {
  mapCenter: { lat: 40.7128, lng: -74.006 },
  activeTab: "search",
  preferences: {
    defaultTravelMode: "driving",
    units: "metric",
    language: "en",
  },
}

export function usePreferences() {
  const {
    data: preferences,
    loading,
    error,
    mutate,
    isAuthenticated,
  } = useApi<UserPreferences>("/api/preferences", defaultPreferences)

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!isAuthenticated) {
        // For unauthenticated users, just update local state
        mutate({ ...(preferences || defaultPreferences), ...updates })
        return
      }

      try {
        const updatedPreferences = await apiRequest("/api/preferences", {
          method: "PUT",
          body: JSON.stringify(updates),
        })

        mutate(updatedPreferences)
      } catch (error) {
        console.error("Error updating preferences:", error)
        // Fallback to local state update
        mutate({ ...(preferences || defaultPreferences), ...updates })
      }
    },
    [isAuthenticated, mutate, preferences],
  )

  const setMapCenter = useCallback(
    (mapCenter: { lat: number; lng: number }) => {
      updatePreferences({ mapCenter })
    },
    [updatePreferences],
  )

  const setActiveTab = useCallback(
    (activeTab: "search" | "saved" | "trips") => {
      updatePreferences({ activeTab })
    },
    [updatePreferences],
  )

  return {
    preferences: preferences || defaultPreferences,
    loading,
    error,
    updatePreferences,
    setMapCenter,
    setActiveTab,
    isAuthenticated,
  }
}
