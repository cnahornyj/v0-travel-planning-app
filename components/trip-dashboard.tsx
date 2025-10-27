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
  onUpdatePlaceImages?: (tripId: string, placeId: string, userImages: string[]) => void
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
  onUpdatePlaceImages,
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

  const getVisitPreferenceIcon = (preference?: Place["visitPreference"]) => {
    switch (preference) {
      case "morning":
        return <Sun className="h-4 w-4" />
      case "afternoon":
        return <Clock3 className="h-4 w-4" />
      case "evening":
        return <Sunset className="h-4 w-4" />
      case "night":
        return <Moon className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Trips</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
                <DialogDescription>Plan your next adventure</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Trip Name</label>
                  <Input
                    placeholder="e.g., Summer in Paris"
                    value={newTrip.name}
                    onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="What's this trip about?"
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

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
          <p className="text-muted-foreground mb-4">Create your first trip to start planning!</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Trip
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Trips</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>Plan your next adventure</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Trip Name</label>
                <Input
                  placeholder="e.g., Summer in Paris"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="What's this trip about?"
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

      <div className="space-y-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{trip.name}</h3>
                  {trip.description && <p className="text-muted-foreground mb-2">{trip.description}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {trip.startDate && trip.endDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <Badge variant="secondary">{trip.places.length} places</Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setScheduleGeneratorTrip(trip)}
                    title="Generate Schedule"
                  >
                    <Route className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setEditingTrip(trip)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => onDeleteTrip(trip.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expandedTrip === trip.id && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold mb-2">Add Places to Trip</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {savedPlaces
                        .filter((place) => !trip.places.some((p) => p.id === place.id))
                        .map((place) => (
                          <Button
                            key={place.id}
                            variant="outline"
                            size="sm"
                            onClick={() => onAddPlaceToTrip(trip.id, place)}
                            className="justify-start"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            {place.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {trip.places.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Places in this trip:</h4>
                  {trip.places.map((place) => (
                    <Card key={place.id} className="p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 cursor-pointer" onClick={() => onPlaceSelect(place)}>
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium">{place.name}</h5>
                            {place.visitPreference && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                {getVisitPreferenceIcon(place.visitPreference)}
                                {place.visitPreference}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{place.address}</span>
                          </div>
                          {place.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{place.rating}</span>
                            </div>
                          )}
                          {place.notes && (
                            <div className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {place.notes}
                            </div>
                          )}
                          {place.tags && place.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {place.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingNotes({
                                tripId: trip.id,
                                placeId: place.id,
                                notes: place.notes || "",
                              })
                            }
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          {onUpdatePlaceTags && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingTags({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  tags: place.tags || [],
                                  newTag: "",
                                })
                              }
                            >
                              <Tag className="h-3 w-3" />
                            </Button>
                          )}
                          {onUpdatePlaceVisitPreference && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingVisitPreference({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  preference: place.visitPreference || "anytime",
                                })
                              }
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemovePlaceFromTrip(trip.id, place.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingTrip} onOpenChange={() => setEditingTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
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

      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>

          {editingNotes && (
            <Textarea
              value={editingNotes.notes}
              onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
              placeholder="Add notes about this place..."
              rows={5}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotes(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTags} onOpenChange={() => setEditingTags(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tags</DialogTitle>
          </DialogHeader>

          {editingTags && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={editingTags.newTag}
                  onChange={(e) => setEditingTags({ ...editingTags, newTag: e.target.value })}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button onClick={handleAddTag}>Add</Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {editingTags.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
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

      <Dialog open={!!editingVisitPreference} onOpenChange={() => setEditingVisitPreference(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Visit Preference</DialogTitle>
            <DialogDescription>When would you like to visit this place?</DialogDescription>
          </DialogHeader>

          {editingVisitPreference && (
            <Select
              value={editingVisitPreference.preference}
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
                    <Sun className="h-4 w-4" />
                    Morning
                  </div>
                </SelectItem>
                <SelectItem value="afternoon">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    Afternoon
                  </div>
                </SelectItem>
                <SelectItem value="evening">
                  <div className="flex items-center gap-2">
                    <Sunset className="h-4 w-4" />
                    Evening
                  </div>
                </SelectItem>
                <SelectItem value="night">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Night
                  </div>
                </SelectItem>
                <SelectItem value="anytime">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Anytime
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVisitPreference(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVisitPreference}>Save Preference</Button>
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
