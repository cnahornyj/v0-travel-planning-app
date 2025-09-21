"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Calendar, Plus, MapPin, Star, Trash2, Edit, Clock, PlusCircle, Route, FileText } from "lucide-react"
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
}: TripDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)
  const [addPlaceToTripId, setAddPlaceToTripId] = useState<string | null>(null)
  const [scheduleGeneratorTrip, setScheduleGeneratorTrip] = useState<Trip | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ tripId: string; placeId: string; notes: string } | null>(null)

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

      {/* Edit Trip Dialog */}
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
