"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Star,
  Phone,
  Globe,
  Heart,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  MoveUp,
  MoveDown,
  Trash2,
} from "lucide-react"
import type { Place, Trip } from "./travel-planner"

interface PlaceDetailsProps {
  place: Place
  onClose: () => void
  onSave: (place: Place) => void
  isSaved: boolean
  trips?: Trip[]
  onAddPlaceToTrip?: (tripId: string, place: Place) => void
  onUpdateImages?: (placeId: string, userImages: string[]) => void
}

export function PlaceDetails({
  place,
  onClose,
  onSave,
  isSaved,
  trips = [],
  onAddPlaceToTrip,
  onUpdateImages,
}: PlaceDetailsProps) {
  const [detailedPlace, setDetailedPlace] = useState<Place>(place)
  const [isLoading, setIsLoading] = useState(false)
  const [showTripSelection, setShowTripSelection] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const allImages = [...(detailedPlace.photos || []), ...(detailedPlace.userImages || [])]

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleAddImageFromUrl = async () => {
    if (!imageUrl.trim() || !onUpdateImages) return

    const updatedImages = [...(detailedPlace.userImages || []), imageUrl.trim()]

    console.log("[v0] Adding image URL:", imageUrl.trim())
    console.log("[v0] Place ID:", detailedPlace.id)
    console.log("[v0] Updated userImages array:", updatedImages)
    console.log("[v0] Full place object:", detailedPlace)

    setDetailedPlace((prev) => ({ ...prev, userImages: updatedImages }))

    try {
      await onUpdateImages(detailedPlace.id, updatedImages)
      console.log("[v0] Image saved successfully")
    } catch (error) {
      console.error("[v0] Error saving image:", error)
    }

    setImageUrl("")
    setShowImageUpload(false)
  }

  const handleRemoveImage = async (imageIndex: number) => {
    if (!onUpdateImages) return

    const googlePhotosCount = detailedPlace.photos?.length || 0
    const userImageIndex = imageIndex - googlePhotosCount

    if (userImageIndex >= 0 && detailedPlace.userImages) {
      const updatedImages = detailedPlace.userImages.filter((_, index) => index !== userImageIndex)

      console.log("[v0] Removing image at index:", userImageIndex)
      console.log("[v0] Updated userImages array:", updatedImages)

      setDetailedPlace((prev) => ({ ...prev, userImages: updatedImages }))
      await onUpdateImages(detailedPlace.id, updatedImages)

      if (currentImageIndex >= allImages.length - 1) {
        setCurrentImageIndex(Math.max(0, allImages.length - 2))
      }
    }
  }

  const moveImageUp = async (index: number) => {
    if (index === 0 || !onUpdateImages) return

    const googlePhotosCount = detailedPlace.photos?.length || 0

    if (index < googlePhotosCount) return

    const userImageIndex = index - googlePhotosCount
    const userImages = [...(detailedPlace.userImages || [])]

    const temp = userImages[userImageIndex]
    userImages[userImageIndex] = userImages[userImageIndex - 1]
    userImages[userImageIndex - 1] = temp

    console.log("[v0] Moving image up, new order:", userImages)

    setDetailedPlace((prev) => ({ ...prev, userImages: userImages }))
    await onUpdateImages(detailedPlace.id, userImages)
    setCurrentImageIndex(index - 1)
  }

  const moveImageDown = async (index: number) => {
    if (!onUpdateImages) return

    const googlePhotosCount = detailedPlace.photos?.length || 0
    const userImagesCount = detailedPlace.userImages?.length || 0

    if (index < googlePhotosCount || index >= googlePhotosCount + userImagesCount - 1) return

    const userImageIndex = index - googlePhotosCount
    const userImages = [...(detailedPlace.userImages || [])]

    const temp = userImages[userImageIndex]
    userImages[userImageIndex] = userImages[userImageIndex + 1]
    userImages[userImageIndex + 1] = temp

    console.log("[v0] Moving image down, new order:", userImages)

    setDetailedPlace((prev) => ({ ...prev, userImages: userImages }))
    await onUpdateImages(detailedPlace.id, userImages)
    setCurrentImageIndex(index + 1)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const getPriceLevelText = (level?: number) => {
    if (level === undefined) return null
    const levels = ["Free", "Inexpensive", "Moderate", "Expensive", "Very Expensive"]
    return levels[level] || "Unknown"
  }

  const formatOpeningHours = () => {
    if (!detailedPlace.openingHours?.weekdayText) return null

    const today = new Date().getDay()
    const todayHours = detailedPlace.openingHours.weekdayText[today === 0 ? 6 : today - 1]

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Today:</span>
          <span className="text-sm">{todayHours?.replace(/^[^:]+:\s*/, "") || "Hours not available"}</span>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-primary">All hours</summary>
          <div className="mt-2 space-y-1 pl-4">
            {detailedPlace.openingHours.weekdayText.map((hours, index) => (
              <div key={index}>{hours}</div>
            ))}
          </div>
        </details>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <Card className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="z-10 flex flex-shrink-0 items-start justify-between border-b bg-card p-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold leading-tight">{detailedPlace.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{detailedPlace.address}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {allImages.length > 0 && (
              <div className="relative">
                <img
                  src={allImages[currentImageIndex] || "/placeholder.svg"}
                  alt={detailedPlace.name}
                  className="w-full rounded-lg"
                />
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                    {onUpdateImages && currentImageIndex >= (detailedPlace.photos?.length || 0) && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {currentImageIndex > (detailedPlace.photos?.length || 0) && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-8"
                            onClick={() => moveImageUp(currentImageIndex)}
                            title="Move image up"
                          >
                            <MoveUp className="size-3" />
                          </Button>
                        )}
                        {currentImageIndex < allImages.length - 1 && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-8"
                            onClick={() => moveImageDown(currentImageIndex)}
                            title="Move image down"
                          >
                            <MoveDown className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-8"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                          title="Remove image"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {detailedPlace.rating && (
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{detailedPlace.rating}</span>
                </div>
              )}

              {detailedPlace.isOpen !== undefined && (
                <Badge variant={detailedPlace.isOpen ? "default" : "secondary"}>
                  {detailedPlace.isOpen ? "Open Now" : "Closed"}
                </Badge>
              )}

              {detailedPlace.priceLevel !== undefined && <Badge>{getPriceLevelText(detailedPlace.priceLevel)}</Badge>}

              {detailedPlace.type && <Badge variant="outline">{detailedPlace.type.replace("_", " ")}</Badge>}
            </div>

            {formatOpeningHours()}

            {(detailedPlace.phone || detailedPlace.website) && (
              <div className="space-y-2">
                {detailedPlace.phone && (
                  <a href={`tel:${detailedPlace.phone}`} className="flex items-center gap-2 text-sm hover:underline">
                    <Phone className="size-4" />
                    {detailedPlace.phone}
                  </a>
                )}

                {detailedPlace.website && (
                  <a
                    href={detailedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="size-4" />
                    Visit Website
                  </a>
                )}
              </div>
            )}

            {detailedPlace.reviews && detailedPlace.reviews.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Reviews</h3>
                {detailedPlace.reviews.map((review, index) => (
                  <Card key={index} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{review.author}</span>
                      <div className="flex items-center gap-1">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </Card>
                ))}
              </div>
            )}

            {onUpdateImages && (
              <div className="space-y-2">
                {!showImageUpload ? (
                  <Button variant="outline" onClick={() => setShowImageUpload(true)} className="w-full">
                    <Plus className="mr-2 size-4" />
                    Add Image URL
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddImageFromUrl()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={handleAddImageFromUrl} size="sm">
                        Add
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowImageUpload(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => onSave(detailedPlace)} disabled={isSaved} className="flex-1">
                <Heart className="mr-2 size-4" />
                {isSaved ? "Saved" : "Save Place"}
              </Button>

              {trips.length > 0 && (
                <Button variant="outline" onClick={() => setShowTripSelection(true)}>
                  <Plus className="mr-2 size-4" />
                  Add to Trip
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showTripSelection} onOpenChange={setShowTripSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Trip</DialogTitle>
            <DialogDescription>Select a trip to add this place to</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {trips.map((trip) => (
              <Button
                key={trip.id}
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => {
                  if (onAddPlaceToTrip) {
                    onAddPlaceToTrip(trip.id, detailedPlace)
                    setShowTripSelection(false)
                  }
                }}
              >
                <Calendar className="mr-2 size-4" />
                {trip.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
