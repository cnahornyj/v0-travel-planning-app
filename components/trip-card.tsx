"use client"

import type { Trip } from "@/app/page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, MoreVertical, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { PlaceDialog } from "@/components/place-dialog"
import { Badge } from "@/components/ui/badge"

interface TripCardProps {
  trip: Trip
  onUpdate: (trip: Trip) => void
  onDelete: (tripId: string) => void
}

export function TripCard({ trip, onUpdate, onDelete }: TripCardProps) {
  const [isPlaceDialogOpen, setIsPlaceDialogOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <>
      <Card className="group transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{trip.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {trip.destination}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(trip.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
          </div>

          {trip.places.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-foreground">Places</h4>
              <div className="space-y-2">
                {trip.places.slice(0, 3).map((place) => (
                  <div key={place.id} className="flex items-start gap-2 rounded-md bg-secondary p-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-foreground">{place.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                    </div>
                  </div>
                ))}
                {trip.places.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{trip.places.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button onClick={() => setIsPlaceDialogOpen(true)} variant="outline" className="w-full">
            <MapPin className="mr-2 h-4 w-4" />
            Add Place
          </Button>
        </CardContent>
      </Card>

      <PlaceDialog open={isPlaceDialogOpen} onOpenChange={setIsPlaceDialogOpen} trip={trip} onUpdate={onUpdate} />
    </>
  )
}
