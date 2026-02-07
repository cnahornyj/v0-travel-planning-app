"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Star,
  Phone,
  Globe,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  MoveUp,
  MoveDown,
  Trash2,
  Edit2,
  Check,
  Clock,
} from "lucide-react"
import type { Place, Trip } from "./travel-planner"

interface PlaceDetailsProps {
  place: Place
  onClose: () => void
  trips?: Trip[]
  onAddPlaceToTrip?: (tripId: string, place: Place) => void
  onUpdateImages?: (placeId: string, photos: string[]) => void
  onUpdateWebsite?: (placeId: string, website: string) => void
  onUpdateTags?: (placeId: string, tags: string[]) => void
  onUpdateOpeningHours?: (placeId: string, weekdayText: string[]) => void
  onUpdateName?: (placeId: string, name: string) => void
}

export function PlaceDetails({
  place,
  onClose,
  trips = [],
  onAddPlaceToTrip,
  onUpdateImages,
  onUpdateWebsite,
  onUpdateTags,
  onUpdateOpeningHours,
  onUpdateName,
}: PlaceDetailsProps) {
  const [detailedPlace, setDetailedPlace] = useState<Place>(place)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isEditingWebsite, setIsEditingWebsite] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState(detailedPlace.website || "")
  const [isEditingHours, setIsEditingHours] = useState(false)
  const [openingHours, setOpeningHours] = useState<string[]>(detailedPlace.openingHours?.weekdayText || [])
  const [isAddingHours, setIsAddingHours] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(detailedPlace.name)

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

  const handleUpdateName = async () => {
    if (!onUpdateName || !editedName.trim()) return

    const trimmedName = editedName.trim()
    setDetailedPlace((prev) => ({ ...prev, name: trimmedName }))

    try {
      await onUpdateName(detailedPlace.id, trimmedName)
      setIsEditingName(false)
    } catch (error) {
      console.error("[v0] Error saving place name:", error)
    }
  }

  const handleAddImageFromUrl = async () => {
    if (!imageUrl.trim() || !onUpdateImages) return

    const updatedPhotos = [...(detailedPlace.photos || []), imageUrl.trim()]

    setDetailedPlace((prev) => ({ ...prev, photos: updatedPhotos }))

    try {
      await onUpdateImages(detailedPlace.id, updatedPhotos)
    } catch (error) {
      console.error("[v0] Error saving image:", error)
    }

    setImageUrl("")
    setShowImageUpload(false)
  }

  const handleUpdateWebsite = async () => {
    if (!onUpdateWebsite) return

    const trimmedUrl = websiteUrl.trim()

    setDetailedPlace((prev) => ({ ...prev, website: trimmedUrl }))

    try {
      await onUpdateWebsite(detailedPlace.id, trimmedUrl)
      setIsEditingWebsite(false)
    } catch (error) {
      console.error("[v0] Error saving website URL:", error)
    }
  }

  const handleUpdateOpeningHours = async () => {
    if (!onUpdateOpeningHours) return

    setDetailedPlace((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        weekdayText: openingHours,
      },
    }))

    try {
      await onUpdateOpeningHours(detailedPlace.id, openingHours)
      setIsEditingHours(false)
      setIsAddingHours(false)
    } catch (error) {
      console.error("[v0] Error saving opening hours:", error)
    }
  }

  const handleRemoveImage = async (imageIndex: number) => {
    if (!onUpdateImages || !detailedPlace.photos) return

    const updatedPhotos = detailedPlace.photos.filter((_, index) => index !== imageIndex)

    setDetailedPlace((prev) => ({ ...prev, photos: updatedPhotos }))
    await onUpdateImages(detailedPlace.id, updatedPhotos)

    if (currentImageIndex >= detailedPlace.photos.length - 1) {
      setCurrentImageIndex(Math.max(0, detailedPlace.photos.length - 2))
    }
  }

  const moveImageUp = async (index: number) => {
    if (index === 0 || !onUpdateImages || !detailedPlace.photos) return

    const photos = [...detailedPlace.photos]
    const temp = photos[index]
    photos[index] = photos[index - 1]
    photos[index - 1] = temp

    setDetailedPlace((prev) => ({ ...prev, photos }))
    await onUpdateImages(detailedPlace.id, photos)
    setCurrentImageIndex(index - 1)
  }

  const moveImageDown = async (index: number) => {
    if (!onUpdateImages || !detailedPlace.photos || index >= detailedPlace.photos.length - 1) return

    const photos = [...detailedPlace.photos]
    const temp = photos[index]
    photos[index] = photos[index + 1]
    photos[index + 1] = temp

    setDetailedPlace((prev) => ({ ...prev, photos }))
    await onUpdateImages(detailedPlace.id, photos)
    setCurrentImageIndex(index + 1)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (detailedPlace.photos || []).length)
  }

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + (detailedPlace.photos || []).length) % (detailedPlace.photos || []).length,
    )
  }

  const getPriceLevelText = (level?: number) => {
    if (level === undefined) return null
    const levels = ["Free", "Inexpensive", "Moderate", "Expensive", "Very Expensive"]
    return levels[level] || "Unknown"
  }

  const formatOpeningHours = () => {
    const hours = detailedPlace.openingHours?.weekdayText

    if (!hours || hours.length === 0) {
      if (!isAddingHours) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span className="text-sm text-muted-foreground">Horaires non disponibles</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingHours(true)
                  setOpeningHours([
                    "Lundi: ",
                    "Mardi: ",
                    "Mercredi: ",
                    "Jeudi: ",
                    "Vendredi: ",
                    "Samedi: ",
                    "Dimanche: ",
                  ])
                }}
              >
                Ajouter les horaires
              </Button>
            </div>
          </div>
        )
      }
    }

    const today = new Date().getDay()
    const todayHours = hours && hours.length > 0 ? hours[today === 0 ? 6 : today - 1] : null

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            <span className="text-sm font-medium">Horaires:</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setIsEditingHours(!isEditingHours)
              setOpeningHours(hours || [])
            }}
          >
            <Edit2 className="size-3" />
          </Button>
        </div>

        {!isEditingHours && !isAddingHours ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Aujourd'hui:</span>
              <span>{todayHours?.replace(/^[^:]+:\s*/, "") || "Non disponible"}</span>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-primary">Tous les horaires</summary>
              <div className="mt-2 space-y-1 pl-4">
                {hours?.map((dayHours, index) => (
                  <div key={index}>{dayHours}</div>
                ))}
              </div>
            </details>
          </>
        ) : (
          <div className="space-y-2">
            {openingHours.map((dayHours, index) => (
              <Input
                key={index}
                value={dayHours}
                onChange={(e) => {
                  const newHours = [...openingHours]
                  newHours[index] = e.target.value
                  setOpeningHours(newHours)
                }}
                placeholder={`Exemple: Lundi: 9:00 AM – 5:00 PM`}
                className="text-sm"
              />
            ))}
            <div className="flex gap-2">
              <Button onClick={handleUpdateOpeningHours} size="sm">
                <Check className="mr-2 size-3" />
                Enregistrer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingHours(false)
                  setIsAddingHours(false)
                  setOpeningHours(detailedPlace.openingHours?.weekdayText || [])
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleAddTag = async () => {
    if (!newTag.trim() || !onUpdateTags) return

    const currentTags = detailedPlace.tags || []
    if (currentTags.includes(newTag.trim())) {
      setNewTag("")
      return
    }

    const updatedTags = [...currentTags, newTag.trim()]
    setDetailedPlace((prev) => ({ ...prev, tags: updatedTags }))

    try {
      await onUpdateTags(detailedPlace.id, updatedTags)
      setNewTag("")
    } catch (error) {
      console.error("[v0] Error adding tag:", error)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!onUpdateTags) return

    const updatedTags = (detailedPlace.tags || []).filter((tag) => tag !== tagToRemove)
    setDetailedPlace((prev) => ({ ...prev, tags: updatedTags }))

    try {
      await onUpdateTags(detailedPlace.id, updatedTags)
    } catch (error) {
      console.error("[v0] Error removing tag:", error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <Card className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="z-10 flex flex-shrink-0 items-start justify-between border-b bg-card p-6">
          <div className="flex-1">
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                autoFocus
                className="text-2xl font-bold"
                onBlur={() => {
                  if (editedName.trim()) {
                    handleUpdateName()
                  } else {
                    setEditedName(detailedPlace.name)
                    setIsEditingName(false)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur()
                  } else if (e.key === "Escape") {
                    setEditedName(detailedPlace.name)
                    setIsEditingName(false)
                  }
                }}
              />
            ) : (
              <h2
                className={`text-2xl font-bold leading-tight ${onUpdateName ? "cursor-pointer hover:text-primary" : ""}`}
                onClick={() => {
                  if (onUpdateName) {
                    setEditedName(detailedPlace.name)
                    setIsEditingName(true)
                  }
                }}
                title={onUpdateName ? "Cliquer pour modifier le nom" : undefined}
              >
                {detailedPlace.name}
              </h2>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{detailedPlace.address}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {(detailedPlace.photos || []).length > 0 && (
              <div className="relative">
                <img
                  src={detailedPlace.photos[currentImageIndex] || "/placeholder.svg"}
                  alt={detailedPlace.name}
                  className="w-full rounded-lg"
                />
                {(detailedPlace.photos || []).length > 1 && (
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
                      {currentImageIndex + 1} / {(detailedPlace.photos || []).length}
                    </div>
                    {onUpdateImages && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {currentImageIndex > 0 && (
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
                        {currentImageIndex < (detailedPlace.photos || []).length - 1 && (
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
                  {detailedPlace.isOpen ? "Ouvert" : "Fermé"}
                </Badge>
              )}

              {detailedPlace.priceLevel !== undefined && <Badge>{getPriceLevelText(detailedPlace.priceLevel)}</Badge>}

              {detailedPlace.type && <Badge variant="outline">{detailedPlace.type.replace("_", " ")}</Badge>}
            </div>

            {formatOpeningHours()}

            <div className="space-y-2">
              {detailedPlace.phone && (
                <a href={`tel:${detailedPlace.phone}`} className="flex items-center gap-2 text-sm hover:underline">
                  <Phone className="size-4" />
                  {detailedPlace.phone}
                </a>
              )}

              {!isEditingWebsite ? (
                <div className="flex items-center justify-between gap-2">
                  {detailedPlace.website ? (
                    <a
                      href={detailedPlace.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="size-4" />
                      Visiter le site web
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="size-4" />
                      Aucun site web
                    </span>
                  )}
                  {onUpdateWebsite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setWebsiteUrl(detailedPlace.website || "")
                        setIsEditingWebsite(true)
                      }}
                    >
                      <Edit2 className="size-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Entrez l'URL du site web (https://...)"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateWebsite()
                      } else if (e.key === "Escape") {
                        setIsEditingWebsite(false)
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleUpdateWebsite} size="icon" className="flex-shrink-0">
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingWebsite(false)}
                    className="flex-shrink-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tags:</span>
                {onUpdateTags && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setIsEditingTags(!isEditingTags)}
                  >
                    <Edit2 className="size-3" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {detailedPlace.tags && detailedPlace.tags.length > 0 ? (
                  detailedPlace.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      {isEditingTags && onUpdateTags && (
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Aucun tag</span>
                )}
              </div>

              {isEditingTags && onUpdateTags && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddTag()
                      } else if (e.key === "Escape") {
                        setIsEditingTags(false)
                        setNewTag("")
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {detailedPlace.reviews && detailedPlace.reviews.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Avis</h3>
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
                    Ajouter une image (URL)
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Entrez l'URL de l'image"
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
                        Ajouter
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowImageUpload(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
