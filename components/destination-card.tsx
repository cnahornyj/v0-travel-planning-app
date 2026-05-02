"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Info, Trash2, Calendar, Pencil, Images, X, GripVertical } from "lucide-react"
import type { Trip } from "@/components/travel-planner"

interface DestinationCardProps {
  trip: Trip
  onClick: () => void
  onInfoClick: (e: React.MouseEvent) => void
  onEditClick: (e: React.MouseEvent) => void
  onDeleteClick: (e: React.MouseEvent) => void
  onUpdateCoverPhotos?: (tripId: string, coverPhotos: string[]) => void
}

export function DestinationCard({ trip, onClick, onInfoClick, onEditClick, onDeleteClick, onUpdateCoverPhotos }: DestinationCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPhotoManager, setShowPhotoManager] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Collect all photos from all places in this trip
  const allPhotos = trip.places
    .flatMap((place) => place.photos || [])
    .filter((photo) => photo && photo.length > 0)

  // Use coverPhotos if available, otherwise fall back to all photos from places
  const orderedPhotos = trip.coverPhotos && trip.coverPhotos.length > 0 
    ? trip.coverPhotos 
    : allPhotos

  // Use a default image if no photos exist
  const images = orderedPhotos.length > 0 ? orderedPhotos : ["/diverse-travel-destinations.png"]
  const hasMultipleImages = images.length > 1

  // For photo manager: show all available photos
  const availablePhotos = allPhotos

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
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-foreground">{trip.name}</h3>
          {trip.startDate && trip.endDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>
                {new Date(trip.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                {' - '}
                {new Date(trip.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {onUpdateCoverPhotos && availablePhotos.length > 1 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setShowPhotoManager(true)
              }}
              className="size-8 rounded-full hover:bg-muted"
              title="Manage photos"
            >
              <Images className="size-3.5 text-muted-foreground" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onEditClick}
            className="size-8 rounded-full hover:bg-muted"
            title="Edit destination"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onInfoClick}
            className="size-8 rounded-full hover:bg-muted"
            title="View details"
          >
            <Info className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDeleteClick}
            className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            title="Delete destination"
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Photo Manager Dialog */}
      <Dialog open={showPhotoManager} onOpenChange={setShowPhotoManager}>
        <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Manage Cover Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Glissez-deposez les photos pour les reordonner. La premiere photo sera la couverture.
            </p>
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {(trip.coverPhotos && trip.coverPhotos.length > 0 ? trip.coverPhotos : availablePhotos).map((photo, index) => {
                const currentPhotos = trip.coverPhotos && trip.coverPhotos.length > 0 ? trip.coverPhotos : availablePhotos
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index && draggedIndex !== index
                
                return (
                  <div
                    key={`${photo}-${index}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(index)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null)
                      setDragOverIndex(null)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      setDragOverIndex(index)
                    }}
                    onDragLeave={() => {
                      setDragOverIndex(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedIndex !== null && draggedIndex !== index) {
                        const photos = [...currentPhotos]
                        const draggedPhoto = photos[draggedIndex]
                        photos.splice(draggedIndex, 1)
                        photos.splice(index, 0, draggedPhoto)
                        onUpdateCoverPhotos?.(trip.id, photos)
                      }
                      setDraggedIndex(null)
                      setDragOverIndex(null)
                    }}
                    className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border-2 transition-all active:cursor-grabbing ${
                      isDragging ? "opacity-50 scale-95" : ""
                    } ${isDragOver ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="size-full object-cover pointer-events-none"
                    />
                    {index === 0 && (
                      <div className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        Cover
                      </div>
                    )}
                    <div className="absolute right-2 top-2 rounded bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <GripVertical className="size-4 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          const photos = currentPhotos.filter((_, i) => i !== index)
                          onUpdateCoverPhotos?.(trip.id, photos)
                        }}
                        title="Remove from cover"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Show available photos not in cover */}
            {trip.coverPhotos && trip.coverPhotos.length > 0 && (
              <>
                {availablePhotos.filter(p => !trip.coverPhotos?.includes(p)).length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-sm font-medium">Available Photos</p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {availablePhotos.filter(p => !trip.coverPhotos?.includes(p)).map((photo, index) => (
                        <button
                          key={`available-${photo}-${index}`}
                          className="relative aspect-square overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary"
                          onClick={() => {
                            const newPhotos = [...(trip.coverPhotos || []), photo]
                            onUpdateCoverPhotos?.(trip.id, newPhotos)
                          }}
                          title="Add to cover photos"
                        >
                          <img
                            src={photo}
                            alt={`Available ${index + 1}`}
                            className="size-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                            <span className="text-xs font-medium text-white">+ Add</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              {trip.coverPhotos && trip.coverPhotos.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => onUpdateCoverPhotos?.(trip.id, [])}
                >
                  Reset to Default
                </Button>
              )}
              <Button onClick={() => setShowPhotoManager(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
