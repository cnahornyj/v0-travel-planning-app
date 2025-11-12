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

  const getVisitPreferenceIcon = (preference?: Place["visitPreference"]) => {
    switch (preference) {
      case "morning":
        return <Sun className="size-4" />
      case "afternoon":
        return <Clock3 className="size-4" />
      case "evening":
        return <Sunset className="size-4" />
      case "night":
        return <Moon className="size-4" />
      default:
        return <Clock className="size-4" />
    }
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Trips</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Create Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
                <DialogDescription>Plan your next adventure</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trip Name</label>
                  <Input
                    value={newTrip.name}
                    onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                    placeholder="e.g., Summer in Tokyo"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                    placeholder="Brief description of your trip"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
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

        <Card className="p-8 text-center">
          <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No trips yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first trip to start planning!</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Your First Trip
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Trips</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>Plan your next adventure</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Trip Name</label>
                <Input
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  placeholder="e.g., Summer in Tokyo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTrip.description}
                  onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                  placeholder="Brief description of your trip"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
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

      <div className="space-y-3">
        {trips.map((trip) => (
          <Card key={trip.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{trip.name}</h3>
                  {trip.description && <p className="text-sm text-muted-foreground">{trip.description}</p>}
                  {trip.startDate && trip.endDate && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {trip.places.length} places
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setScheduleGeneratorTrip(trip)}
                    title="Generate Schedule"
                  >
                    <Route className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditingTrip(trip)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                  >
                    <PlusCircle className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteTrip(trip.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {expandedTrip === trip.id && (
                <div className="space-y-2 rounded-lg border p-3">
                  <h4 className="text-sm font-medium">Add Places to Trip</h4>
                  <div className="space-y-1">
                    {savedPlaces
                      .filter((place) => !trip.places.some((p) => p.id === place.id))
                      .map((place) => (
                        <Button
                          key={place.id}
                          variant="outline"
                          size="sm"
                          onClick={() => onAddPlaceToTrip(trip.id, place)}
                          className="w-full justify-start"
                        >
                          <MapPin className="mr-2 size-4" />
                          {place.name}
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {trip.places.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Places in this trip:</h4>
                  {trip.places.map((place) => (
                    <Card key={place.id} className="overflow-hidden p-0">
                      <div className="flex">
                        {/* Left side: Large prominent image */}
                        <div className="flex-shrink-0 cursor-pointer" onClick={() => onPlaceSelect(place)}>
                          <img
                            src={place.photos?.[0] || "/placeholder.svg?height=200&width=200"}
                            alt={place.name}
                            className="h-full w-48 object-cover"
                          />
                        </div>

                        {/* Right side: All place information */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                          <div className="cursor-pointer space-y-2" onClick={() => onPlaceSelect(place)}>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-lg font-semibold leading-tight">{place.name}</h5>
                              {place.visitPreference && (
                                <Badge variant="outline" className="flex-shrink-0 gap-1 text-xs">
                                  {getVisitPreferenceIcon(place.visitPreference)}
                                  {place.visitPreference}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">{place.address}</p>

                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{place.rating}</span>
                              </div>
                            )}

                            {place.notes && (
                              <p className="text-sm italic text-muted-foreground">
                                <FileText className="mr-1 inline size-3" />
                                {place.notes}
                              </p>
                            )}

                            {place.tags && place.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {place.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    <Tag className="mr-1 size-3" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingNotes({
                                  tripId: trip.id,
                                  placeId: place.id,
                                  notes: place.notes || "",
                                })
                              }
                            >
                              <FileText className="mr-1 size-3" />
                              Notes
                            </Button>
                            {onUpdatePlaceTags && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingTags({
                                    tripId: trip.id,
                                    placeId: place.id,
                                    tags: place.tags || [],
                                    newTag: "",
                                  })
                                }
                              >
                                <Tag className="mr-1 size-3" />
                                Tags
                              </Button>
                            )}
                            {onUpdatePlaceVisitPreference && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingVisitPreference({
                                    tripId: trip.id,
                                    placeId: place.id,
                                    preference: place.visitPreference || "anytime",
                                  })
                                }
                              >
                                <Clock className="mr-1 size-3" />
                                Time
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => onRemovePlaceFromTrip(trip.id, place.id)}
                            >
                              <Trash2 className="mr-1 size-3" />
                              Remove
                            </Button>
                          </div>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Trip Name</label>
                <Input
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingTrip.description || ""}
                  onChange={(e) => setEditingTrip({ ...editingTrip, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={editingTrip.startDate || ""}
                    onChange={(e) => setEditingTrip({ ...editingTrip, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
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
              rows={5}
              placeholder="Add notes about this place..."
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
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button onClick={handleAddTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingTags.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-2">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
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
            <DialogTitle>Set Visit Time Preference</DialogTitle>
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
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
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
