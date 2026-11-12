"use client"

import type React from "react"
import { Car, Footprints, TrainFront, UtensilsCrossed } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Pace, ScheduleOptions, TravelMode } from "@/lib/ai-schedule/types"

interface SegmentedOption<T extends string> {
  value: T
  label: string
  hint?: string
  icon?: React.ReactNode
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-sm transition-colors",
              value === option.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1.5 font-medium">
              {option.icon}
              {option.label}
            </span>
            {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

const PACE_OPTIONS: SegmentedOption<Pace>[] = [
  { value: "relaxed", label: "Détendu", hint: "Peu d'étapes" },
  { value: "balanced", label: "Équilibré", hint: "Recommandé" },
  { value: "intense", label: "Intense", hint: "Journées pleines" },
]

const MODE_OPTIONS: SegmentedOption<TravelMode>[] = [
  { value: "walking", label: "À pied", icon: <Footprints className="size-4" aria-hidden /> },
  { value: "transit", label: "Transports", icon: <TrainFront className="size-4" aria-hidden /> },
  { value: "driving", label: "Voiture", icon: <Car className="size-4" aria-hidden /> },
]

interface ScheduleOptionsFormProps {
  options: ScheduleOptions
  onChange: (options: ScheduleOptions) => void
  placeCount: number
  dayCount: number
  travelTimes: TravelTimes
  onTravelTimesChange: (times: TravelTimes) => void
  arrivalDate?: string
  departureDate?: string
}

export interface TravelTimes {
  arrivalTime: string
  departureTime: string
}

function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
}

export function ScheduleOptionsForm({
  options,
  onChange,
  placeCount,
  dayCount,
  travelTimes,
  onTravelTimesChange,
  arrivalDate,
  departureDate,
}: ScheduleOptionsFormProps) {
  const update = (partial: Partial<ScheduleOptions>) => onChange({ ...options, ...partial })
  const invalidWindow = options.dayStart >= options.dayEnd

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{placeCount}</span> lieu{placeCount > 1 ? "x" : ""} enregistré
        {placeCount > 1 ? "s" : ""} à répartir sur <span className="font-medium text-foreground">{dayCount}</span> jour
        {dayCount > 1 ? "s" : ""}. Les événements déjà prévus restent en place.
      </p>

      {(arrivalDate || departureDate) && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Arrivée et départ</legend>
          <div className="grid grid-cols-2 gap-4">
            {arrivalDate && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="ai-arrival-time" className="font-normal text-muted-foreground">
                  Arrivée le {formatShortDate(arrivalDate)}
                </Label>
                <Input
                  id="ai-arrival-time"
                  type="time"
                  value={travelTimes.arrivalTime}
                  onChange={(e) => onTravelTimesChange({ ...travelTimes, arrivalTime: e.target.value })}
                />
              </div>
            )}
            {departureDate && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="ai-departure-time" className="font-normal text-muted-foreground">
                  Départ le {formatShortDate(departureDate)}
                </Label>
                <Input
                  id="ai-departure-time"
                  type="time"
                  value={travelTimes.departureTime}
                  onChange={(e) => onTravelTimesChange({ ...travelTimes, departureTime: e.target.value })}
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {"1 h est laissée libre après l'arrivée et 2 h avant le départ. Laisser vide pour une journée complète."}
          </p>
        </fieldset>
      )}

      <Segmented label="Rythme" value={options.pace} options={PACE_OPTIONS} onChange={(pace) => update({ pace })} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-day-start">Début de journée</Label>
          <Input
            id="ai-day-start"
            type="time"
            value={options.dayStart}
            onChange={(e) => update({ dayStart: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-day-end">Fin de journée</Label>
          <Input id="ai-day-end" type="time" value={options.dayEnd} onChange={(e) => update({ dayEnd: e.target.value })} />
        </div>
        {invalidWindow && (
          <p className="col-span-2 text-sm text-destructive" role="alert">
            La fin de journée doit être après le début.
          </p>
        )}
      </div>

      <Segmented
        label="Déplacements"
        value={options.travelMode}
        options={MODE_OPTIONS}
        onChange={(travelMode) => update({ travelMode })}
      />

      <button
        type="button"
        role="switch"
        aria-checked={options.lunchBreak}
        onClick={() => update({ lunchBreak: !options.lunchBreak })}
        className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-3">
          <UtensilsCrossed className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex flex-col">
            <span className="text-sm font-medium">Pause déjeuner</span>
            <span className="text-xs text-muted-foreground">Créneau libre de 12h30 à 14h</span>
          </span>
        </span>
        <span
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            options.lunchBreak ? "bg-primary" : "bg-muted",
          )}
          aria-hidden
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-background shadow transition-transform",
              options.lunchBreak ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </span>
      </button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-instructions">Consigne pour l&apos;IA (facultatif)</Label>
        <Textarea
          id="ai-instructions"
          value={options.instructions ?? ""}
          maxLength={1000}
          rows={3}
          placeholder="Ex. : pas de visite avant 10h le dimanche, garder le dernier jour léger…"
          onChange={(e) => update({ instructions: e.target.value })}
        />
      </div>
    </div>
  )
}
