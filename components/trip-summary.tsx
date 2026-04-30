"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ChevronDown, ChevronUp, PieChart as PieChartIcon, Euro, MapPin } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
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
}

interface TagData {
  name: string
  value: number
  count: number
  color: string
  percentage: string
}

export function TripSummary({ trip, tagColors, onUpdateTagColor }: TripSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate tag distribution and costs
  const { tagData, totalEstimatedCost, placesWithCost, placesCount } = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    let totalCost = 0
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
          totalCost += numericPrice
          costCount++
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

  if (trip.places.length === 0) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between p-4 hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <PieChartIcon className="size-5 text-primary" />
              <span className="font-semibold">Trip Summary</span>
              <span className="text-sm text-muted-foreground">
                ({placesCount} places)
              </span>
            </div>
            <div className="flex items-center gap-4">
              {totalEstimatedCost > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Euro className="size-4 text-muted-foreground" />
                  <span className="font-medium">{totalEstimatedCost.toFixed(2)}</span>
                  <span className="text-muted-foreground">estimated</span>
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4" />
                  Places by Tag
                </h3>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ name, percentage }) => `${percentage}%`}
                        labelLine={false}
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
              </div>

              {/* Tag Legend with Color Selector */}
              <div className="flex flex-col">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                  Tag Distribution
                </h3>
                <div className="space-y-2">
                  {tagData.map((tag) => (
                    <div
                      key={tag.name}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        {tag.name !== "Other" ? (
                          <input
                            type="color"
                            value={tag.color}
                            onChange={(e) => onUpdateTagColor(tag.name, e.target.value)}
                            className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                            title={`Change color for ${tag.name}`}
                          />
                        ) : (
                          <div
                            className="size-6 rounded"
                            style={{ backgroundColor: tag.color }}
                          />
                        )}
                        <span className="font-medium">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{tag.count} place{tag.count !== 1 ? "s" : ""}</span>
                        <span className="font-medium text-foreground">{tag.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost Summary */}
                {totalEstimatedCost > 0 && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <Euro className="size-4" />
                      Cost Estimate
                    </h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total estimated:</span>
                        <span className="font-semibold">{totalEstimatedCost.toFixed(2)} EUR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Places with prices:</span>
                        <span>{placesWithCost} of {placesCount}</span>
                      </div>
                      {placesWithCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Average per place:</span>
                          <span>{(totalEstimatedCost / placesWithCost).toFixed(2)} EUR</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export { TAG_COLORS }
