"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScheduleGenerator } from "./schedule-generator"
import {
  Calendar,
  Plus,
  MapPin,
  Star,
  Trash2,
  Edit,
  Clock,
  PlusCircle,
  Route,
  FileText,
  Tag,
  Sun,
  Sunset,
  Moon,
  Clock3,
} from "lucide-react"
import type { Trip, Place } from "./travel-planner"

interface TripDashboardProps {
  trips: Trip[]
  savedPlaces: Place[]
  onCreateTrip: (trip: Omit<Trip, "id" | "createdAt">) => void
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void
  onDeleteTrip: (tripId: string) => void
  onAddPlaceToTrip: (tripId: string, place: Place) => void
  onRemovePlaceFromTrip: (tripId: string, placeId: string) => void
  onPlaceSelect: (place: Place) => void
  onUpdatePlaceNotes: (tripId: string, placeId: string, notes: string) => void
  onUpdatePlaceTags?: (tripId: string, placeId: string, tags: string[]) => void
  onUpdatePlaceVisitPreference?: (tripId: string, placeId: string, visitPreference: Place["visitPreference"]) => void
  onUpdatePlaceImages?: (tripId: string, placeId: string, userImages: string[]) => void // Added image update handler
}

export function TripDashboard({
  trips,
  savedPlaces,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onAddPlaceToTrip,
  onRemovePlaceFromTrip,
  onPlaceSelect,
  onUpdatePlaceNotes,
  onUpdatePlaceTags,
  onUpdatePlaceVisitPreference,
  onUpdatePlaceImages, // Added image update handler
}: TripDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)
  const [addPlaceToTripId, setAddPlaceToTripId] = useState<string | null>(null)
  const [scheduleGeneratorTrip, setScheduleGeneratorTrip] = useState<Trip | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ tripId: string; placeId: string; notes: string } | null>(null)
  const [editingTags, setEditingTags] = useState<{
    tripId: string
    placeId: string
    tags: string[]
    newTag: string
  } | null>(null)
  const [editingVisitPreference, setEditingVisitPreference] = useState<{
    tripId: string
    placeId: string
    preference: Place["visitPreference"]
  } | null>(null)
  const [editingImages, setEditingImages] = useState<{
    tripId: string
    placeId: string
    images: string[]
    newImage: string
  } | null>(null)

  const [newTrip, setNewTrip] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    places: [] as Place[],
  })

  const handleCreateTrip = () => {
    if (newTrip.name.trim()) {
      onCreateTrip(newTrip)
      setNewTrip({ name: "", description: "", startDate: "", endDate: "", places: [] })
      setIsCreateDialogOpen(false)
    }
  }

  const handleUpdateTrip = () => {
    if (editingTrip && editingTrip.name.trim()) {
      onUpdateTrip(editingTrip.id, editingTrip)
      setEditingTrip(null)
    }
  }

  const handleSaveNotes = () => {
    if (editingNotes) {
      onUpdatePlaceNotes(editingNotes.tripId, editingNotes.placeId, editingNotes.notes)
      setEditingNotes(null)
    }
  }

  const handleSaveTags = () => {
    if (editingTags && onUpdatePlaceTags) {
      onUpdatePlaceTags(editingTags.tripId, editingTags.placeId, editingTags.tags)
      setEditingTags(null)
    }
  }

  const handleAddTag = () => {
    if (editingTags && editingTags.newTag.trim()) {
      const newTag = editingTags.newTag.trim()
      if (!editingTags.tags.includes(newTag)) {
        setEditingTags({
          ...editingTags,
          tags: [...editingTags.tags, newTag],
          newTag: "",
        })
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingTags) {
      setEditingTags({
        ...editingTags,
        tags: editingTags.tags.filter((tag) => tag !== tagToRemove),
      })
    }
  }

  const handleSaveVisitPreference = () => {
    if (editingVisitPreference && onUpdatePlaceVisitPreference) {
      onUpdatePlaceVisitPreference(
        editingVisitPreference.tripId,
        editingVisitPreference.placeId,
        editingVisitPreference.preference,
      )
      setEditingVisitPreference(null)
    }
  }

  const handleSaveImages = () => {
    if (editingImages && onUpdatePlaceImages) {
      onUpdatePlaceImages(editingImages.tripId, editingImages.placeId, editingImages.images)
      setEditingImages(null)
    }
  }

  const handleAddImage = () => {
    if (editingImages && editingImages.newImage.trim()) {
      const newImage = editingImages.newImage.trim()
      if (!editingImages.images.includes(newImage)) {
        setEditingImages({
          ...editingImages,
          images: [...editingImages.images, newImage],
          newImage: "",
        })
      }
    }
  }

  const handleRemoveImage = (imageToRemove: string) => {
    if (editingImages) {
      setEditingImages({
        ...editingImages,
        images: editingImages.images.filter((image) => image !== imageToRemove),
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getTripDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return ""
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`
  }

  const getVisitPreferenceIcon = (preference?: Place["visitPreference"]) => {
    switch (preference) {
      case "morning":
        return <Sun className="w-3 h-3" />
      case "afternoon":
        return <Sun className="w-3 h-3" />
      case "evening":
        return <Sunset className="w-3 h-3" />
      case "night":
        return <Moon className="w-3 h-3" />
      default:
        return <Clock3 className="w-3 h-3" />
    }
  }

  const getVisitPreferenceLabel = (preference?: Place["visitPreference"]) => {
    switch (preference) {
      case "morning":
        return "Morning"
      case "afternoon":
        return "Afternoon"
      case "evening":
        return "Evening"
      case "night":
        return "Night"
      case "anytime":
        return "Anytime"
      default:
        return "Not set"
    }
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No trips planned yet</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Create your first trip to organize your saved places into an itinerary
        </p>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>Plan your next adventure by creating a new trip itinerary.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Trip Name</label>
                <Input
                  placeholder="e.g., Weekend in Paris"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your trip..."
                  value={newTrip.description}
                  onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newTrip.endDate}
                    onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTrip}>Create Trip</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Your Trips</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {trips.length} trip{trips.length !== 1 ? "s" : ""} planned
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
                <DialogDescription>Plan your next adventure by creating a new trip itinerary.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Trip Name</label>
                  <Input
                    placeholder="e.g., Weekend in Paris"
                    value={newTrip.name}
                    onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe your trip..."
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTrip}>Create Trip</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="border-border/50">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{trip.name}</h3>
                  {trip.description && <p className="text-sm text-muted-foreground mt-1">{trip.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {trip.startDate && trip.endDate && (
                      <>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTripDuration(trip.startDate, trip.endDate)}
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {trip.places.length} place{trip.places.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingTrip(trip)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteTrip(trip.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                  >
                    {expandedTrip === trip.id ? "Hide Places" : "View Places"}
                  </Button>

                  {trip.places.length > 1 && trip.startDate && trip.endDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScheduleGeneratorTrip(trip)}
                      className="gap-1"
                    >
                      <Route className="w-3 h-3" />
                      Generate Schedule
                    </Button>
                  )}
                </div>

                <Dialog
                  open={addPlaceToTripId === trip.id}
                  onOpenChange={(open) => setAddPlaceToTripId(open ? trip.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Place
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Place to {trip.name}</DialogTitle>
                      <DialogDescription>Choose from your saved places to add to this trip.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {savedPlaces
                        .filter((place) => !trip.places.some((p) => p.id === place.id))
                        .map((place) => (
                          <Card
                            key={place.id}
                            className="p-3 cursor-pointer hover:bg-accent/5 transition-colors"
                            onClick={() => {
                              onAddPlaceToTrip(trip.id, place)
                              setAddPlaceToTripId(null)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded flex-shrink-0 overflow-hidden">
                                {place.photos?.[0] && (
                                  <img
                                    src={place.photos[0] || "/placeholder.svg"}
                                    alt={place.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{place.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      {savedPlaces.filter((place) => !trip.places.some((p) => p.id === place.id)).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          All your saved places are already in this trip
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {expandedTrip === trip.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  {trip.places.length > 0 ? (
                    trip.places.map((place, index) => (
                      <Card
                        key={place.id}
                        className="p-3 cursor-pointer hover:bg-accent/5 transition-colors"
                        onClick={() => onPlaceSelect(place)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 bg-muted rounded flex-shrink-0 overflow-hidden">
                            {place.photos?.[0] && (
                              <img
                                src={place.photos[0] || "/placeholder.svg"}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{place.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                            {place.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{place.rating}</span>
                              </div>
                            )}
                            {place.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">"{place.notes}"</p>
                            )}
                            {place.tags && place.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {place.tags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {place.visitPreference && (
                              <div className="flex items-center gap-1 mt-1">
                                {getVisitPreferenceIcon(place.visitPreference)}
                                <span className="text-xs text-muted-foreground">
                                  Best time: {getVisitPreferenceLabel(place.visitPreference)}
                                </span>
                              </div>
                            )}
                            {place.userImages && place.userImages.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {place.userImages.map((image, imageIndex) => (
                                  <img
                                    key={imageIndex}
                                    src={image || "/placeholder.svg"}
                                    alt={`Image ${imageIndex}`}
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingNotes({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  notes: place.notes || "",
                                })
                              }}
                              title="Add/Edit notes"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTags({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  tags: place.tags || [],
                                  newTag: "",
                                })
                              }}
                              title="Manage tags"
                            >
                              <Tag className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingVisitPreference({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  preference: place.visitPreference || "anytime",
                                })
                              }}
                              title="Set visit preference"
                            >
                              <Clock3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingImages({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  images: place.userImages || [],
                                  newImage: "",
                                })
                              }}
                              title="Manage images"
                            >
                              <img src="/image-icon.svg" alt="Image" className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemovePlaceFromTrip(trip.id, place.id)
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No places added to this trip yet</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingTrip} onOpenChange={(open) => !open && setEditingTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>Update your trip details.</DialogDescription>
          </DialogHeader>
          {editingTrip && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Trip Name</label>
                <Input
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingTrip.description || ""}
                  onChange={(e) => setEditingTrip({ ...editingTrip, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={editingTrip.startDate || ""}
                    onChange={(e) => setEditingTrip({ ...editingTrip, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={editingTrip.endDate || ""}
                    onChange={(e) => setEditingTrip({ ...editingTrip, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTrip(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTrip}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingNotes} onOpenChange={(open) => !open && setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Place Notes</DialogTitle>
            <DialogDescription>Add your personal notes about this location.</DialogDescription>
          </DialogHeader>
          {editingNotes && (
            <div className="space-y-4">
              <Textarea
                placeholder="Add notes about this place... (e.g., must try the pasta, closes early on Sundays, great for photos)"
                value={editingNotes.notes}
                onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotes(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTags} onOpenChange={(open) => !open && setEditingTags(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>Add tags to categorize and organize this place.</DialogDescription>
          </DialogHeader>
          {editingTags && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag (e.g., restaurant, museum, outdoor)"
                  value={editingTags.newTag}
                  onChange={(e) => setEditingTags({ ...editingTags, newTag: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button onClick={handleAddTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingTags.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              {editingTags.tags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No tags added yet. Add some tags to categorize this place.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTags(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTags}>Save Tags</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVisitPreference} onOpenChange={(open) => !open && setEditingVisitPreference(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Visit Preference</DialogTitle>
            <DialogDescription>
              Choose the best time to visit this place. This can be used when generating schedules.
            </DialogDescription>
          </DialogHeader>
          {editingVisitPreference && (
            <div className="space-y-4">
              <Select
                value={editingVisitPreference.preference || "anytime"}
                onValueChange={(value) =>
                  setEditingVisitPreference({
                    ...editingVisitPreference,
                    preference: value as Place["visitPreference"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Morning (6AM - 12PM)
                    </div>
                  </SelectItem>
                  <SelectItem value="afternoon">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Afternoon (12PM - 6PM)
                    </div>
                  </SelectItem>
                  <SelectItem value="evening">
                    <div className="flex items-center gap-2">
                      <Sunset className="w-4 h-4" />
                      Evening (6PM - 10PM)
                    </div>
                  </SelectItem>
                  <SelectItem value="night">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Night (10PM - 6AM)
                    </div>
                  </SelectItem>
                  <SelectItem value="anytime">
                    <div className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      Anytime
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVisitPreference(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVisitPreference}>Save Preference</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingImages} onOpenChange={(open) => !open && setEditingImages(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Images</DialogTitle>
            <DialogDescription>Add images to this place.</DialogDescription>
          </DialogHeader>
          {editingImages && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add an image URL"
                  value={editingImages.newImage}
                  onChange={(e) => setEditingImages({ ...editingImages, newImage: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && handleAddImage()}
                />
                <Button onClick={handleAddImage} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingImages.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Image ${index}`}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-0 right-0 h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => handleRemoveImage(image)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {editingImages.images.length === 0 && (
                <p className="text-sm text-muted-foreground">No images added yet. Add some images to this place.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingImages(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveImages}>Save Images</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {scheduleGeneratorTrip && (
        <ScheduleGenerator
          trip={scheduleGeneratorTrip}
          onUpdateTrip={onUpdateTrip}
          isOpen={!!scheduleGeneratorTrip}
          onClose={() => setScheduleGeneratorTrip(null)}
        />
      )}
    </div>
  )
}
