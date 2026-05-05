"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ChevronDown, PieChart as PieChartIcon, Euro, MapPin, Trash2 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Trip, Place } from "./travel-planner"

// Predefined color palette for tags
const TAG_COLORS = [
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#f97316", // orange
  "#10b981", // emerald
  "#ec4899", // pink
  "#eab308", // yellow
  "#3b82f6", // blue
  "#ef4444", // red
  "#14b8a6", // teal
  "#a855f7", // purple
]

const OTHER_COLOR = "#94a3b8" // slate-400

interface TripSummaryProps {
  trip: Trip
  tagColors: Record<string, string>
  onUpdateTagColor: (tag: string, color: string) => void
  onDeleteTag?: (tag: string) => void
}

interface TagData {
  name: string
  value: number
  count: number
  color: string
  percentage: string
}

export function TripSummary({ trip, tagColors, onUpdateTagColor, onDeleteTag }: TripSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [placesWithTagCount, setPlacesWithTagCount] = useState(0)

  // Calculate tag distribution and costs
  const { tagData, totalEstimatedCost, amountPaid, remainingBalance, placesWithCost, placesCount } = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    let totalCost = 0
    let paidAmount = 0
    let costCount = 0

    trip.places.forEach((place) => {
      // Count tags
      if (place.tags && place.tags.length > 0) {
        place.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      } else {
        tagCounts["Other"] = (tagCounts["Other"] || 0) + 1
      }

      // Parse price if available
      if (place.price) {
        const numericPrice = parseFloat(place.price.replace(/[^0-9.,]/g, "").replace(",", "."))
        if (!isNaN(numericPrice)) {
          // For hostels, multiply by number of nights
          const isHostel = place.tags?.some(tag => tag.toLowerCase() === "hostel")
          const nights = isHostel && place.numberOfNights ? place.numberOfNights : 1
          const placeTotal = numericPrice * nights
          
          totalCost += placeTotal
          costCount++

          // If reservation is made, add to paid amount
          if (place.reservationMade) {
            paidAmount += placeTotal
          }
        }
      }
    })

    const totalPlaces = trip.places.length
    const data: TagData[] = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => {
        const isOther = name === "Other"
        const existingColor = tagColors[name]
        const color = isOther ? OTHER_COLOR : (existingColor || TAG_COLORS[index % TAG_COLORS.length])
        
        return {
          name,
          value: count,
          count,
          color,
          percentage: ((count / totalPlaces) * 100).toFixed(1),
        }
      })

    return {
      tagData: data,
      totalEstimatedCost: totalCost,
      amountPaid: paidAmount,
      remainingBalance: totalCost - paidAmount,
      placesWithCost: costCount,
      placesCount: totalPlaces,
    }
  }, [trip.places, tagColors])

  // Generate chart config from tag data
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    tagData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      }
    })
    return config
  }, [tagData])

  const handleDeleteTagClick = (tagName: string) => {
    // Count places that have this tag
    const count = trip.places.filter(
      (place) => place.tags?.includes(tagName)
    ).length
    setPlacesWithTagCount(count)
    setTagToDelete(tagName)
  }

  const confirmDeleteTag = () => {
    if (tagToDelete && onDeleteTag) {
      onDeleteTag(tagToDelete)
    }
    setTagToDelete(null)
  }

  if (trip.places.length === 0) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center justify-between p-4 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <PieChartIcon className="size-5 text-primary" />
              <span className="font-semibold">Trip Summary</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {placesCount} lieu{placesCount > 1 ? "x" : ""}
              </span>
            </div>
            <ChevronDown className={`size-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart with Tag Labels Below */}
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4" />
                  Places by Tag
                </h3>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-2.5 rounded-full"
                                  style={{ backgroundColor: item.payload.color }}
                                />
                                <span className="font-medium">{name}</span>
                                <span className="text-muted-foreground">
                                  {value} place{Number(value) !== 1 ? "s" : ""} ({item.payload.percentage}%)
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* Tag Labels with Color Pickers and Delete */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {tagData.map((tag) => (
                    <div
                      key={tag.name}
                      className="group flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors hover:bg-accent/50"
                    >
                      {tag.name !== "Other" ? (
                        <>
                          <input
                            type="color"
                            value={tag.color}
                            onChange={(e) => onUpdateTagColor(tag.name, e.target.value)}
                            className="size-3.5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                            title={`Change color for ${tag.name}`}
                          />
                          <span className="text-xs font-medium">{tag.name}</span>
                          {onDeleteTag && (
                            <button
                              onClick={() => handleDeleteTagClick(tag.name)}
                              className="ml-0.5 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                              title={`Supprimer le tag ${tag.name}`}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div
                            className="size-3.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-xs font-medium">{tag.name}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Estimate Section */}
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Euro className="size-4" />
                  Cost Estimate
                </h3>
                {totalEstimatedCost > 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    {/* Main totals grid */}
                    <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-background p-3">
                        <div className="text-xl font-bold text-primary">
                          {totalEstimatedCost.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total EUR</div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                        <div className="text-xl font-bold text-green-600">
                          {amountPaid.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Payé EUR</div>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
                        <div className="text-xl font-bold text-orange-600">
                          {remainingBalance.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Reste EUR</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lieux avec prix:</span>
                        <span className="font-medium">{placesWithCost} sur {placesCount}</span>
                      </div>
                      {placesWithCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Moyenne par lieu:</span>
                          <span className="font-medium">{(totalEstimatedCost / placesWithCost).toFixed(2)} EUR</span>
                        </div>
                      )}
                      {placesCount - placesWithCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prix manquants:</span>
                          <span className="font-medium">{placesCount - placesWithCost} lieu{placesCount - placesWithCost !== 1 ? "x" : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center">
                    <div>
                      <Euro className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Pas encore de prix estimés
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Ajoutez des prix à vos lieux pour voir le récapitulatif
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>

      {/* Delete Tag Confirmation Dialog */}
      <AlertDialog open={tagToDelete !== null} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le tag &quot;{tagToDelete}&quot; ?</AlertDialogTitle>
            <AlertDialogDescription>
              Attention, le tag sera dissocié de {placesWithTagCount > 0 ? (
                <>toutes les <strong>{placesWithTagCount}</strong> location{placesWithTagCount > 1 ? "s" : ""} qui le contiennent</>
              ) : (
                "toutes les locations"
              )}. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  )
}

export { TAG_COLORS }
