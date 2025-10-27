"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Star, Clock, Phone, Globe, Heart, Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
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

    const request = {
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

    service.getDetails(request, (result: any, status: any) => {
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
            result.reviews?.slice(0, 3).map((review: any) => ({
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
    const todayHours = detailedPlace.openingHours.weekdayText[today === 0 ? 6 : today - 1]

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Today:</span>
          <span>{todayHours?.replace(/^[^:]+:\s*/, "") || "Hours not available"}</span>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">All hours</summary>
          <div className="mt-2 space-y-1 pl-4">
            {detailedPlace.openingHours.weekdayText.map((hours, index) => (
              <div key={index}>{hours}</div>
            ))}
          </div>
        </details>
      </div>
    )
  }

  const handleAddImageFromUrl = () => {
    if (!imageUrl.trim() || !onUpdateImages) return

    const updatedImages = [...(detailedPlace.userImages || []), imageUrl.trim()]
    setDetailedPlace((prev) => ({ ...prev, userImages: updatedImages }))
    onUpdateImages(detailedPlace.id, updatedImages)
    setImageUrl("")
    setShowImageUpload(false)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{detailedPlace.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {detailedPlace.address}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {allImages.length > 0 && (
            <div className="relative">
              <img
                src={allImages[currentImageIndex] || "/placeholder.svg"}
                alt={`${detailedPlace.name} ${currentImageIndex + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
              {allImages.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {detailedPlace.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{detailedPlace.rating}</span>
              </div>
            )}

            {detailedPlace.isOpen !== undefined && (
              <Badge variant={detailedPlace.isOpen ? "default" : "secondary"}>
                <Clock className="h-3 w-3 mr-1" />
                {detailedPlace.isOpen ? "Open Now" : "Closed"}
              </Badge>
            )}

            {detailedPlace.priceLevel !== undefined && (
              <Badge variant="outline">{getPriceLevelText(detailedPlace.priceLevel)}</Badge>
            )}

            {detailedPlace.type && <Badge variant="outline">{detailedPlace.type.replace("_", " ")}</Badge>}
          </div>

          {formatOpeningHours()}

          {(detailedPlace.phone || detailedPlace.website) && (
            <div className="space-y-2">
              {detailedPlace.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${detailedPlace.phone}`} className="text-primary hover:underline">
                    {detailedPlace.phone}
                  </a>
                </div>
              )}

              {detailedPlace.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={detailedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          )}

          {detailedPlace.reviews && detailedPlace.reviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Reviews</h3>
              {detailedPlace.reviews.map((review, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.author}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{review.rating}</span>
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
                <Button variant="outline" size="sm" onClick={() => setShowImageUpload(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              ) : (
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddImageFromUrl()
                        }
                      }}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    />
                    <Button size="sm" onClick={handleAddImageFromUrl} disabled={!imageUrl.trim()}>
                      Add
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <label className="cursor-pointer">
                        Upload File
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                      </label>
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
              <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save Place"}
            </Button>

            {trips.length > 0 && (
              <Button variant="outline" onClick={() => setShowTripSelection(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Trip
              </Button>
            )}
          </div>
        </div>

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
                  <Calendar className="h-4 w-4 mr-2" />
                  {trip.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
