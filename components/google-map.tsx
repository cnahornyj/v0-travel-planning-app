"use client"

import { useEffect, useRef, useState } from "react"
import type { Place } from "./travel-planner"

interface GoogleMapProps {
  center: { lat: number; lng: number }
  selectedPlace: Place | null
  savedPlaces: Place[]
  onPlaceSelect: (place: Place) => void
}

const getPlaceIcon = (type?: string, isSelected = false, isOpen?: boolean) => {
  const iconConfig = {
    restaurant: { color: "#ef4444", symbol: "🍽️" },
    tourist_attraction: { color: "#f59e0b", symbol: "🎯" },
    lodging: { color: "#3b82f6", symbol: "🏨" },
    museum: { color: "#8b5cf6", symbol: "🏛️" },
    park: { color: "#10b981", symbol: "🌳" },
    shopping_mall: { color: "#ec4899", symbol: "🛍️" },
    default: { color: isSelected ? "#1f2937" : "#8b5cf6", symbol: "📍" },
  }

  const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.default

  // Add status indicator ring for open/closed status
  const statusRing =
    isOpen !== undefined
      ? `<circle cx="16" cy="11" r="6" fill="none" stroke="${isOpen ? "#10b981" : "#ef4444"}" strokeWidth="2" opacity="0.8"/>`
      : ""

  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C11.03 2 7 6.03 7 11c0 7 9 17 9 17s9-10 9-17c0-4.97-4.03-9-9-9z" fill="${config.color}" stroke="white" strokeWidth="2"/>
        ${statusRing}
        <circle cx="16" cy="11" r="4" fill="white"/>
        <text x="16" y="15" textAnchor="middle" fontSize="8" fill="${config.color}">${config.symbol}</text>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 32),
  }
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
        icon: getPlaceIcon(place.type, false, place.isOpen),
      })

      const openStatus =
        place.isOpen !== undefined
          ? `<div style="margin: 4px 0; display: flex; align-items: center; gap: 4px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${place.isOpen ? "#10b981" : "#ef4444"};"></div>
          <span style="font-size: 12px; font-weight: 500; color: ${place.isOpen ? "#059669" : "#dc2626"};">
            ${place.isOpen ? "Open" : "Closed"}
          </span>
        </div>`
          : ""

      const todaysHours = place.openingHours?.weekdayText
        ? (() => {
            const today = new Date().getDay()
            const todayIndex = today === 0 ? 6 : today - 1
            const hours = place.openingHours.weekdayText[todayIndex]
            return hours ? hours.replace(/^[^:]+:\s*/, "") : null
          })()
        : null

      const hoursDisplay = todaysHours
        ? `<div style="margin: 4px 0; font-size: 11px; color: #666;">
          <strong>Today:</strong> ${todaysHours}
        </div>`
        : ""

      const contactInfo = [
        place.phone ? `<div style="font-size: 11px; color: #666;">📞 ${place.phone}</div>` : "",
        place.website
          ? `<div style="font-size: 11px;"><a href="${place.website}" target="_blank" style="color: #2563eb;">🌐 Website</a></div>`
          : "",
      ]
        .filter(Boolean)
        .join("")

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${place.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${place.address}</p>
            ${place.rating ? `<div style="margin: 4px 0; font-size: 12px;">⭐ ${place.rating}</div>` : ""}
            ${openStatus}
            ${hoursDisplay}
            ${contactInfo}
          </div>
        `,
      })

      marker.addListener("click", () => {
        // Close all other info windows
        markersRef.current.forEach((m) => m.infoWindow?.close())
        infoWindow.open(mapInstanceRef.current, marker)
        onPlaceSelect(place)
      })

      // Store info window reference
      marker.infoWindow = infoWindow
      markersRef.current.push(marker)
    })

    // Add marker for selected place if it's not saved
    if (selectedPlace && !savedPlaces.some((p) => p.id === selectedPlace.id)) {
      const marker = new window.google.maps.Marker({
        position: { lat: selectedPlace.lat, lng: selectedPlace.lng },
        map: mapInstanceRef.current,
        title: selectedPlace.name,
        icon: getPlaceIcon(selectedPlace.type, true, selectedPlace.isOpen),
      })

      const openStatus =
        selectedPlace.isOpen !== undefined
          ? `<div style="margin: 4px 0; display: flex; align-items: center; gap: 4px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${selectedPlace.isOpen ? "#10b981" : "#ef4444"};"></div>
          <span style="font-size: 12px; font-weight: 500; color: ${selectedPlace.isOpen ? "#059669" : "#dc2626"};">
            ${selectedPlace.isOpen ? "Open" : "Closed"}
          </span>
        </div>`
          : ""

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${selectedPlace.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${selectedPlace.address}</p>
            ${selectedPlace.rating ? `<div style="margin: 4px 0; font-size: 12px;">⭐ ${selectedPlace.rating}</div>` : ""}
            ${openStatus}
          </div>
        `,
      })

      // Auto-open info window for selected place
      infoWindow.open(mapInstanceRef.current, marker)
      marker.infoWindow = infoWindow
      markersRef.current.push(marker)
    }
  }, [savedPlaces, selectedPlace, onPlaceSelect])

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
