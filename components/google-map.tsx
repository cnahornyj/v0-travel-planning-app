"use client"

import { useEffect, useRef, useState } from "react"
import type { Place } from "./travel-planner"

declare global {
  interface Window {
    google: any
  }
}

interface GoogleMapProps {
  center: { lat: number; lng: number }
  selectedPlace: Place | null
  savedPlaces: Place[]
  onPlaceSelect: (place: Place) => void
}

const getPlaceIcon = (type?: string, isSelected = false, isOpen?: boolean) => {
  if (!window.google?.maps) return undefined

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

  const statusRing =
    isOpen !== undefined
      ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${isOpen ? "#10b981" : "#ef4444"}" strokeWidth="2"/>`
      : ""

  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="${config.color}"/>
          ${statusRing}
          <text x="16" y="20" textAnchor="middle" fontSize="12">${config.symbol}</text>
        </svg>
      `),
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 32),
  }
}

export function GoogleMap({ center, selectedPlace, savedPlaces, onPlaceSelect }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && !window.google?.maps) {
      fetch("/api/maps-config")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch maps configuration")
          return res.json()
        })
        .then((data) => {
          const script = document.createElement("script")
          script.src = data.scriptUrl
          script.async = true
          script.defer = true
          script.onload = () => {
            setTimeout(() => {
              if (window.google?.maps) {
                setIsLoaded(true)
              } else {
                setLoadError("Google Maps failed to initialize")
              }
            }, 100)
          }
          script.onerror = () => {
            setLoadError("Failed to load Google Maps script")
          }
          document.head.appendChild(script)
        })
        .catch((error) => {
          console.error("Failed to load Google Maps configuration:", error)
          setLoadError(error.message)
        })
    } else if (typeof window !== "undefined" && window.google?.maps) {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current && window.google?.maps) {
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

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center)
      if (selectedPlace) {
        mapInstanceRef.current.setZoom(15)
      }
    }
  }, [center, selectedPlace])

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    savedPlaces.forEach((place) => {
      const marker = new window.google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current,
        title: place.name,
        icon: getPlaceIcon(place.type, false, place.isOpen),
      })

      const openStatus =
        place.isOpen !== undefined
          ? `<div style="margin-top: 8px; padding: 4px 8px; background: ${place.isOpen ? "#dcfce7" : "#fee2e2"}; border-radius: 4px; display: inline-block;">
              <span style="color: ${place.isOpen ? "#16a34a" : "#dc2626"}; font-weight: 600;">
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
        ? `<div style="margin-top: 4px; color: #6b7280;">
            Today: ${todaysHours}
          </div>`
        : ""

      const contactInfo = [
        place.phone ? `<div style="margin-top: 4px;">📞 ${place.phone}</div>` : "",
        place.website
          ? `<div style="margin-top: 4px;">🌐 <a href="${place.website}" target="_blank" style="color: #3b82f6;">Website</a></div>`
          : "",
      ]
        .filter(Boolean)
        .join("")

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${place.name}</h3>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${place.address}</p>
            ${place.rating ? `<div style="margin-top: 4px;">⭐ ${place.rating}</div>` : ""}
            ${openStatus}
            ${hoursDisplay}
            ${contactInfo}
          </div>
        `,
      })

      marker.addListener("click", () => {
        markersRef.current.forEach((m: any) => m.infoWindow?.close())
        infoWindow.open(mapInstanceRef.current, marker)
        onPlaceSelect(place)
      })
      ;(marker as any).infoWindow = infoWindow
      markersRef.current.push(marker)
    })

    if (selectedPlace && !savedPlaces.some((p) => p.id === selectedPlace.id)) {
      const marker = new window.google.maps.Marker({
        position: { lat: selectedPlace.lat, lng: selectedPlace.lng },
        map: mapInstanceRef.current,
        title: selectedPlace.name,
        icon: getPlaceIcon(selectedPlace.type, true, selectedPlace.isOpen),
      })

      const openStatus =
        selectedPlace.isOpen !== undefined
          ? `<div style="margin-top: 8px; padding: 4px 8px; background: ${selectedPlace.isOpen ? "#dcfce7" : "#fee2e2"}; border-radius: 4px; display: inline-block;">
              <span style="color: ${selectedPlace.isOpen ? "#16a34a" : "#dc2626"}; font-weight: 600;">
                ${selectedPlace.isOpen ? "Open" : "Closed"}
              </span>
            </div>`
          : ""

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${selectedPlace.name}</h3>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${selectedPlace.address}</p>
            ${selectedPlace.rating ? `<div style="margin-top: 4px;">⭐ ${selectedPlace.rating}</div>` : ""}
            ${openStatus}
          </div>
        `,
      })

      infoWindow.open(mapInstanceRef.current, marker)
      ;(marker as any).infoWindow = infoWindow
      markersRef.current.push(marker)
    }
  }, [savedPlaces, selectedPlace, onPlaceSelect])

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Failed to load Google Maps</p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please check your API key configuration and try disabling ad blockers
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure to add your Google Maps API key to environment variables
          </p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full" />
}
