"use client"

import { useEffect, useRef, useState } from "react"
import type { Place } from "./travel-planner"

interface GoogleMapProps {
  center: { lat: number; lng: number }
  selectedPlace: Place | null
  savedPlaces: Place[]
  onPlaceSelect: (place: Place) => void
}

export function GoogleMap({ center, selectedPlace, savedPlaces, onPlaceSelect }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markersRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Google Maps API
  useEffect(() => {
    if (typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    } else if (window.google) {
      setIsLoaded(true)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })
    }
  }, [isLoaded, center])

  // Update map center
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center)
      if (selectedPlace) {
        mapInstanceRef.current.setZoom(15)
      }
    }
  }, [center, selectedPlace])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Add markers for saved places
    savedPlaces.forEach((place) => {
      const marker = new window.google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current,
        title: place.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#8b5cf6"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
        },
      })

      marker.addListener("click", () => {
        onPlaceSelect(place)
      })

      markersRef.current.push(marker)
    })

    // Add marker for selected place if it's not saved
    if (selectedPlace && !savedPlaces.some((p) => p.id === selectedPlace.id)) {
      const marker = new window.google.maps.Marker({
        position: { lat: selectedPlace.lat, lng: selectedPlace.lng },
        map: mapInstanceRef.current,
        title: selectedPlace.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1f2937"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
        },
      })

      markersRef.current.push(marker)
    }
  }, [savedPlaces, selectedPlace])

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure to add your Google Maps API key to environment variables
          </p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full" />
}
