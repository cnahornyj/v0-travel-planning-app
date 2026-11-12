"use client"

import type React from "react"
import {
  AlertTriangle,
  Building2,
  Car,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Footprints,
  Loader2,
  Lock,
  RefreshCw,
  Sun,
  TrainFront,
  Trees,
  Umbrella,
  UtensilsCrossed,
  Wand2,
  Blend,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Place, ScheduledEvent } from "@/components/travel-planner"
import { LUNCH_END, LUNCH_START, type DayWeather, type GeneratedPlan, type TravelMode, type WeatherIcon } from "@/lib/ai-schedule/types"
import { minutesToTime, timeToMinutes } from "@/lib/ai-schedule/time"

const WEATHER_ICONS: Record<WeatherIcon, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

const MODE_ICONS: Record<TravelMode, React.ComponentType<{ className?: string }>> = {
  walking: Footprints,
  transit: TrainFront,
  driving: Car,
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
}

function formatDay(date: string) {
  const label = new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function WeatherChip({ weather }: { weather: DayWeather | null }) {
  if (!weather) {
    return <span className="text-xs text-muted-foreground">Météo indisponible</span>
  }
  const Icon = WEATHER_ICONS[weather.icon]
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5 text-foreground">
        <Icon className="size-4" aria-hidden />
        {weather.label}
      </span>
      <span>
        {weather.tempMin}° / {weather.tempMax}°
      </span>
      <span className="flex items-center gap-1">
        <Umbrella className="size-3" aria-hidden />
        {weather.precipitationProbability}%
      </span>
      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
        {weather.kind === "forecast" ? "Prévision" : "Tendance"}
      </Badge>
    </span>
  )
}

function SettingIcon({ setting }: { setting?: Place["setting"] }) {
  if (setting === "outdoor") return <Trees className="size-3.5" aria-label="Extérieur" />
  if (setting === "indoor") return <Building2 className="size-3.5" aria-label="Intérieur" />
  if (setting === "mixed") return <Blend className="size-3.5" aria-label="Intérieur et extérieur" />
  return null
}

type TimelineItem =
  | { kind: "step"; start: number; index: number }
  | { kind: "existing"; start: number; event: ScheduledEvent }
  | { kind: "lunch"; start: number }

interface SchedulePreviewProps {
  plan: GeneratedPlan
  places: Place[]
  existingEvents: ScheduledEvent[]
  travelMode: TravelMode
  lunchBreak: boolean
  regeneratingDate: string | null
  onRegenerateDay: (date: string) => void
}

export function SchedulePreview({
  plan,
  places,
  existingEvents,
  travelMode,
  lunchBreak,
  regeneratingDate,
  onRegenerateDay,
}: SchedulePreviewProps) {
  const placeById = new Map(places.map((place) => [place.id, place]))
  const ModeIcon = MODE_ICONS[travelMode]
  const busy = regeneratingDate !== null

  return (
    <div className="flex flex-col gap-4">
      {plan.warnings.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          {plan.warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
              {warning}
            </p>
          ))}
        </div>
      )}

      {plan.days.map((day) => {
        const dayEvents = existingEvents.filter((event) => event.date === day.date)
        const items: TimelineItem[] = [
          ...day.steps.map((step, index) => ({ kind: "step" as const, start: timeToMinutes(step.startTime), index })),
          ...dayEvents.map((event) => ({ kind: "existing" as const, start: timeToMinutes(event.startTime), event })),
          ...(lunchBreak && day.steps.length > 0 ? [{ kind: "lunch" as const, start: LUNCH_START }] : []),
        ].sort((a, b) => a.start - b.start)
        const isRegenerating = regeneratingDate === day.date

        return (
          <section key={day.date} aria-labelledby={`day-${day.date}`} className="rounded-xl border bg-card">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
              <div className="flex flex-col gap-1.5">
                <h3 id={`day-${day.date}`} className="font-semibold">
                  {formatDay(day.date)}
                </h3>
                <WeatherChip weather={day.weather} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={busy}
                onClick={() => onRegenerateDay(day.date)}
              >
                {isRegenerating ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )}
                Régénérer ce jour
              </Button>
            </header>

            <div className="flex flex-col px-4 py-3">
              {day.summary && <p className="mb-3 text-sm text-muted-foreground">{day.summary}</p>}

              {items.length === 0 && <p className="py-2 text-sm text-muted-foreground">Journée libre.</p>}

              <ol className="flex flex-col">
                {items.map((item) => {
                  if (item.kind === "lunch") {
                    return (
                      <li key="lunch" className="flex gap-3 py-1.5 text-sm text-muted-foreground">
                        <span className="w-12 shrink-0 font-mono text-xs leading-5">{minutesToTime(LUNCH_START)}</span>
                        <span className="flex items-center gap-2">
                          <UtensilsCrossed className="size-3.5" aria-hidden />
                          Pause déjeuner · {formatDuration(LUNCH_END - LUNCH_START)}
                        </span>
                      </li>
                    )
                  }

                  if (item.kind === "existing") {
                    const place = placeById.get(item.event.placeId)
                    return (
                      <li key={item.event.id} className="flex gap-3 py-1.5 text-sm text-muted-foreground">
                        <span className="w-12 shrink-0 font-mono text-xs leading-5">{item.event.startTime}</span>
                        <span className="flex items-center gap-2">
                          <Lock className="size-3.5" aria-hidden />
                          {place?.name ?? "Événement"} · {formatDuration(item.event.duration)}
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                            Déjà prévu
                          </Badge>
                        </span>
                      </li>
                    )
                  }

                  const step = day.steps[item.index]
                  const place = placeById.get(step.placeId)
                  return (
                    <li key={step.placeId} className="flex flex-col">
                      {step.travelMinutes ? (
                        <span className="ml-[3.75rem] flex items-center gap-1.5 border-l border-dashed py-1 pl-3 text-xs text-muted-foreground">
                          <ModeIcon className="size-3" aria-hidden />
                          {formatDuration(step.travelMinutes)} de trajet (estimé)
                        </span>
                      ) : null}
                      <div className="flex gap-3 py-1.5">
                        <span className="w-12 shrink-0 font-mono text-xs leading-5 text-primary">{step.startTime}</span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <span className="truncate">{place?.name ?? "Lieu"}</span>
                            <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground">
                              <SettingIcon setting={place?.setting} />
                              {formatDuration(step.duration)}
                            </span>
                          </span>
                          <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Wand2 className="mt-0.5 size-3 shrink-0" aria-hidden />
                            <span>
                              {step.reason}
                              {step.adjusted && " (horaire ajusté pour respecter les contraintes)"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>
        )
      })}

      {plan.unplaced.length > 0 && (
        <section aria-labelledby="unplaced-title" className="rounded-xl border border-dashed px-4 py-3">
          <h3 id="unplaced-title" className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-amber-500" aria-hidden />
            Lieux non placés ({plan.unplaced.length})
          </h3>
          <ul className="flex flex-col gap-1.5">
            {plan.unplaced.map((entry) => (
              <li key={entry.placeId} className="text-sm">
                <span className="font-medium">{placeById.get(entry.placeId)?.name ?? "Lieu"}</span>
                <span className="text-muted-foreground"> — {entry.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
