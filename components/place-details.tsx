"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  X,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Heart,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
} from "lucide-react"
import type { Place, Trip } from "./travel-planner"
import type { google } from "google-maps"

interface PlaceDetailsProps {
  place: Place
  onClose: () => void
  onSave: (place: Place) => void
  isSaved: boolean
  trips?: Trip[]
  onAddPlaceToTrip?: (tripId: string, place: Place) => void
  onUpdateImages?: (placeId: string, userImages: string[]) => void // Added image update handler
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0) // Added carousel state
  const [showImageUpload, setShowImageUpload] = useState(false) // Added image upload dialog state

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

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !onUpdateImages) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const updatedImages = [...(detailedPlace.userImages || []), imageUrl]
        setDetailedPlace((prev) => ({ ...prev, userImages: updatedImages }))
        onUpdateImages(detailedPlace.id, updatedImages)
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    event.target.value = ""
    setShowImageUpload(false)
  }

  const handleRemoveImage = (imageIndex: number) => {
    if (!onUpdateImages) return

    const googlePhotosCount = detailedPlace.photos?.length || 0
    const userImageIndex = imageIndex - googlePhotosCount

    if (userImageIndex >= 0 && detailedPlace.userImages) {
      const updatedImages = detailedPlace.userImages.filter((_, index) => index !== userImageIndex)
      setDetailedPlace((prev) => ({ ...prev, userImages: updatedImages }))
      onUpdateImages(detailedPlace.id, updatedImages)

      // Adjust current image index if needed
      if (currentImageIndex >= allImages.length - 1) {
        setCurrentImageIndex(Math.max(0, allImages.length - 2))
      }
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const fetchPlaceDetails = async () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return
    }

    setIsLoading(true)
    const service = new window.google.maps.places.PlacesService(document.createElement("div"))

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: place.id,
      fields: [
        "name",
        "formatted_address",
        "geometry",
        "rating",
        "photos",
        "opening_hours",
        "formatted_phone_number",
        "website",
        "price_level",
        "reviews",
        "business_status",
      ],
    }

    service.getDetails(request, (result, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
        const updatedPlace: Place = {
          ...place,
          phone: result.formatted_phone_number,
          website: result.website,
          priceLevel: result.price_level,
          openingHours: result.opening_hours
            ? {
                periods: result.opening_hours.periods || [],
                weekdayText: result.opening_hours.weekday_text || [],
              }
            : undefined,
          isOpen: result.opening_hours?.isOpen?.() ?? undefined,
          reviews:
            result.reviews?.slice(0, 3).map((review) => ({
              author: review.author_name,
              rating: review.rating,
              text: review.text,
              time: review.time,
            })) || [],
        }
        setDetailedPlace(updatedPlace)
      }
      setIsLoading(false)
    })
  }

  useEffect(() => {
    fetchPlaceDetails()
  }, [place.id])

  const getPriceLevelText = (level?: number) => {
    if (level === undefined) return null
    const levels = ["Free", "Inexpensive", "Moderate", "Expensive", "Very Expensive"]
    return levels[level] || "Unknown"
  }

  const formatOpeningHours = () => {
    if (!detailedPlace.openingHours?.weekdayText) return null

    const today = new Date().getDay()
    const todayHours = detailedPlace.openingHours.weekdayText[today === 0 ? 6 : today - 1] // Adjust for Sunday = 0

    return (
      <div className="space-y-1">
        <div className="font-medium text-sm">
          Today: {todayHours?.replace(/^[^:]+:\s*/, "") || "Hours not available"}
        </div>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">View all hours</summary>
          <div className="mt-2 space-y-1">
            {detailedPlace.openingHours.weekdayText.map((hours, index) => (
              <div key={index}>{hours}</div>
            ))}
          </div>
        </details>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-end pr-4 z-50" onClick={handleOverlayClick}>
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-background shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{detailedPlace.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate">{detailedPlace.address}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
              aria-label="Close place details"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Status and Rating */}
          <div className="flex items-center gap-4 mb-4">
            {detailedPlace.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{detailedPlace.rating}</span>
              </div>
            )}

            {detailedPlace.isOpen !== undefined && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${detailedPlace.isOpen ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className={`text-sm font-medium ${detailedPlace.isOpen ? "text-green-600" : "text-red-600"}`}>
                  {detailedPlace.isOpen ? "Open" : "Closed"}
                </span>
              </div>
            )}

            {detailedPlace.priceLevel !== undefined && (
              <Badge variant="secondary">{getPriceLevelText(detailedPlace.priceLevel)}</Badge>
            )}
          </div>

          {/* Image Carousel */}
          {allImages && allImages.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <img
                  src={allImages[currentImageIndex] || "/placeholder.svg"}
                  alt={detailedPlace.name}
                  className="w-full h-48 object-cover rounded-lg"
                />

                {/* Carousel Controls */}
                {allImages.length > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}

                {/* Upload Button */}
                {onUpdateImages && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => setShowImageUpload(true)}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}

                {/* Remove Image Button (only for user images) */}
                {onUpdateImages && currentImageIndex >= (detailedPlace.photos?.length || 0) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 left-2"
                    onClick={() => handleRemoveImage(currentImageIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Image Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${
                        index === currentImageIndex ? "border-primary" : "border-transparent"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${detailedPlace.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4 mb-4">
            {/* Opening Hours */}
            {detailedPlace.openingHours && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Opening Hours</span>
                </div>
                {formatOpeningHours()}
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-3">
              {detailedPlace.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${detailedPlace.phone}`} className="text-sm text-blue-600 hover:underline">
                    {detailedPlace.phone}
                  </a>
                </div>
              )}

              {detailedPlace.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={detailedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          {detailedPlace.reviews && detailedPlace.reviews.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-3">Recent Reviews</h3>
              <div className="space-y-3">
                {detailedPlace.reviews.map((review, index) => (
                  <div key={index} className="border-l-2 border-muted pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.author}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {trips.length > 0 && onAddPlaceToTrip && (
              <Button variant="outline" onClick={() => setShowTripSelection(true)} className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Add to Trip
              </Button>
            )}
            <Button onClick={() => onSave(detailedPlace)} disabled={isSaved} className="flex-1">
              {isSaved ? (
                <>
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  Saved
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save Place
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} className="min-w-[80px] bg-transparent">
              Close
            </Button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
            </div>
          )}
        </div>
      </Card>

      {/* Trip Selection Dialog */}
      <Dialog open={showTripSelection} onOpenChange={setShowTripSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Trip</DialogTitle>
            <DialogDescription>Choose which trip to add "{detailedPlace.name}" to.</DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {trips.map((trip) => {
              const isAlreadyInTrip = trip.places.some((p) => p.id === detailedPlace.id)
              return (
                <Card
                  key={trip.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    isAlreadyInTrip ? "bg-muted/50 cursor-not-allowed" : "hover:bg-accent/5"
                  }`}
                  onClick={() => {
                    if (!isAlreadyInTrip && onAddPlaceToTrip) {
                      onAddPlaceToTrip(trip.id, detailedPlace)
                      setShowTripSelection(false)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{trip.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {trip.places.length} place{trip.places.length !== 1 ? "s" : ""}
                        {trip.startDate && trip.endDate && (
                          <span> • {new Date(trip.startDate).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    {isAlreadyInTrip && (
                      <Badge variant="secondary" className="text-xs">
                        Already added
                      </Badge>
                    )}
                  </div>
                </Card>
              )
            })}
            {trips.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No trips created yet. Create a trip first to add places to it.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>Add your own photos of this place to your collection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Click to upload images</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                Choose Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
