"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Trash2 } from "lucide-react"
import type { Trip } from "@/components/travel-planner"

interface DestinationCardProps {
  trip: Trip
  onClick: () => void
  onInfoClick: (e: React.MouseEvent) => void
  onDeleteClick: (e: React.MouseEvent) => void
}

export function DestinationCard({ trip, onClick, onInfoClick, onDeleteClick }: DestinationCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Collect all photos from all places in this trip
  const allPhotos = trip.places
    .flatMap((place) => place.photos || [])
    .filter((photo) => photo && photo.length > 0)

  // Use a default image if no photos exist
  const images = allPhotos.length > 0 ? allPhotos : ["/diverse-travel-destinations.png"]
  const hasMultipleImages = images.length > 1

  useEffect(() => {
    if (isHovering && hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      }, 1500) // Change image every 1.5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Reset to first image when not hovering
      if (!isHovering) {
        setCurrentImageIndex(0)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isHovering, hasMultipleImages, images.length])

  return (
    <Card
      className="group cursor-pointer overflow-hidden border border-border/50 bg-card p-0 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-border"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {images.map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image || "/placeholder.svg"}
            alt={`${trip.name} - Image ${index + 1}`}
            className={`absolute inset-0 size-full object-cover transition-all duration-500 ${
              index === currentImageIndex 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-105"
            } ${isHovering && index === currentImageIndex ? "scale-105" : ""}`}
          />
        ))}
        
        {/* Carousel indicators */}
        {hasMultipleImages && isHovering && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? "w-4 bg-white" 
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Photo count badge */}
        {hasMultipleImages && (
          <div className={`absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}>
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between px-4 py-2.5">
        <h3 className="text-lg font-semibold text-foreground">{trip.name}</h3>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onInfoClick}
            className="size-9 rounded-full hover:bg-muted"
          >
            <Info className="size-4 text-muted-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDeleteClick}
            className="size-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
