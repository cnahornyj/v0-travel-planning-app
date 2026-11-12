"use client"

import { useMemo, useState } from "react"
import { Check, Circle, Loader2, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Place, ScheduledEvent, Trip } from "@/components/travel-planner"
import { dateRange, distanceKm, isLodging } from "@/lib/ai-schedule/time"
import type {
  GeneratedPlan,
  GenerationStep,
  PlaceUpdate,
  ScheduleOptions,
  StreamMessage,
} from "@/lib/ai-schedule/types"
import { ScheduleOptionsForm } from "./schedule-options-form"
import { SchedulePreview } from "./schedule-preview"

const STEPS: Array<{ id: GenerationStep; label: string }> = [
  { id: "places", label: "Analyse des lieux et des horaires" },
  { id: "weather", label: "Récupération de la météo" },
  { id: "planning", label: "Regroupement par proximité et planification" },
]

function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function applyUpdates(places: Place[], updates: Record<string, PlaceUpdate>): Place[] {
  return places.map((place) => (updates[place.id] ? { ...place, ...updates[place.id] } : place))
}

function toPayloadPlace(place: Place) {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    type: place.type,
    tags: place.tags?.slice(0, 30),
    estimatedDuration: place.estimatedDuration,
    visitPreference: place.visitPreference,
    setting: place.setting,
    openingHours: place.openingHours
      ? { periods: place.openingHours.periods ?? [], weekdayText: place.openingHours.weekdayText ?? [] }
      : undefined,
  }
}

async function streamGeneration(
  body: unknown,
  onStep: (step: GenerationStep) => void,
): Promise<GeneratedPlan> {
  const response = await fetch("/api/schedule/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok || !response.body) throw new Error("La génération du planning a échoué.")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (;;) {
    const { done, value } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.trim()) continue
      const message = JSON.parse(line) as StreamMessage
      if (message.type === "step") onStep(message.step)
      if (message.type === "error") throw new Error(message.message)
      if (message.type === "result") return message.plan
    }
    if (done) break
  }
  throw new Error("Réponse incomplète du serveur.")
}

type Phase = "options" | "generating" | "preview"

interface AiScheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip
  onApply: (events: Omit<ScheduledEvent, "id">[], placeUpdates: Record<string, PlaceUpdate>) => Promise<void>
}

export function AiScheduleDialog({ isOpen, onClose, trip, onApply }: AiScheduleDialogProps) {
  const existingEvents = trip.scheduledEvents ?? []
  const today = localDateKey()

  const dates = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return []
    const start = trip.startDate.slice(0, 10) > today ? trip.startDate.slice(0, 10) : today
    return dateRange(start, trip.endDate.slice(0, 10))
  }, [trip.startDate, trip.endDate, today])

  const candidates = useMemo(() => {
    const scheduled = new Set(existingEvents.map((event) => event.placeId))
    return trip.places.filter((place) => !scheduled.has(place.id) && !isLodging(place))
  }, [trip.places, existingEvents])

  const defaultTravelMode = useMemo(() => {
    const far = candidates.some((a) => candidates.some((b) => distanceKm(a, b) > 4))
    return far ? "transit" : "walking"
  }, [candidates])

  const [phase, setPhase] = useState<Phase>("options")
  const [options, setOptions] = useState<ScheduleOptions>({
    pace: "balanced",
    dayStart: "09:00",
    dayEnd: "19:00",
    travelMode: defaultTravelMode,
    lunchBreak: true,
    instructions: "",
  })
  const [currentStep, setCurrentStep] = useState<GenerationStep | null>(null)
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [regeneratingDate, setRegeneratingDate] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const enrichedPlaces = useMemo(() => applyUpdates(trip.places, plan?.placeUpdates ?? {}), [trip.places, plan])

  const buildRequest = (placeIds: Set<string>, targetDates: string[]) => ({
    places: enrichedPlaces.filter((place) => placeIds.has(place.id)).map(toPayloadPlace),
    events: existingEvents.map(({ placeId, date, startTime, duration }) => ({ placeId, date, startTime, duration })),
    dates: targetDates,
    today,
    options: { ...options, instructions: options.instructions?.trim() || undefined },
  })

  const handleGenerate = async () => {
    setError(null)
    setPhase("generating")
    setCurrentStep("places")
    try {
      const result = await streamGeneration(
        buildRequest(new Set(candidates.map((place) => place.id)), dates),
        setCurrentStep,
      )
      setPlan(result)
      setPhase("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "La génération du planning a échoué.")
      setPhase("options")
    } finally {
      setCurrentStep(null)
    }
  }

  const handleRegenerateDay = async (date: string) => {
    if (!plan) return
    const day = plan.days.find((d) => d.date === date)
    const placeIds = new Set([...(day?.steps.map((s) => s.placeId) ?? []), ...plan.unplaced.map((u) => u.placeId)])
    if (placeIds.size === 0) return

    setError(null)
    setRegeneratingDate(date)
    try {
      const result = await streamGeneration(buildRequest(placeIds, [date]), () => {})
      setPlan((prev) => {
        if (!prev) return prev
        const newDay = result.days.find((d) => d.date === date)
        return {
          days: prev.days.map((d) => (d.date === date && newDay ? newDay : d)),
          unplaced: [...prev.unplaced.filter((u) => !placeIds.has(u.placeId)), ...result.unplaced],
          placeUpdates: { ...prev.placeUpdates, ...result.placeUpdates },
          warnings: result.warnings.length ? result.warnings : prev.warnings,
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "La régénération a échoué.")
    } finally {
      setRegeneratingDate(null)
    }
  }

  const stepCount = plan?.days.reduce((sum, day) => sum + day.steps.length, 0) ?? 0

  const handleApply = async () => {
    if (!plan || stepCount === 0) return
    setIsApplying(true)
    try {
      const events = plan.days.flatMap((day) =>
        day.steps.map((step) => ({
          placeId: step.placeId,
          date: day.date,
          startTime: step.startTime,
          duration: step.duration,
          notes: step.reason,
        })),
      )
      await onApply(events, plan.placeUpdates)
      handleClose()
    } finally {
      setIsApplying(false)
    }
  }

  const handleClose = () => {
    if (phase === "generating" || isApplying) return
    setPhase("options")
    setPlan(null)
    setError(null)
    onClose()
  }

  const blocker =
    dates.length === 0
      ? "Ajoutez des dates de début et de fin (à venir) au voyage pour générer un planning."
      : candidates.length === 0
        ? "Tous les lieux enregistrés sont déjà planifiés."
        : null

  const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            Générer le planning avec l&apos;IA
          </DialogTitle>
          <DialogDescription>
            {phase === "preview"
              ? "Vérifiez la proposition avant de l'ajouter au calendrier."
              : "Les lieux enregistrés sont répartis selon leurs horaires, leur proximité et la météo."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          {phase === "options" &&
            (blocker ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{blocker}</p>
            ) : (
              <ScheduleOptionsForm
                options={options}
                onChange={setOptions}
                placeCount={candidates.length}
                dayCount={dates.length}
              />
            ))}

          {phase === "generating" && (
            <ol className="flex flex-col gap-4 py-6" aria-live="polite">
              {STEPS.map((step, index) => {
                const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "pending"
                return (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    {status === "done" && <Check className="size-5 text-primary" aria-hidden />}
                    {status === "active" && <Loader2 className="size-5 animate-spin text-primary" aria-hidden />}
                    {status === "pending" && <Circle className="size-5 text-muted-foreground/40" aria-hidden />}
                    <span className={status === "pending" ? "text-muted-foreground" : "font-medium"}>
                      {step.label}
                      <span className="sr-only">
                        {status === "done" ? " : terminé" : status === "active" ? " : en cours" : " : en attente"}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}

          {phase === "preview" && plan && (
            <SchedulePreview
              plan={plan}
              places={enrichedPlaces}
              existingEvents={existingEvents}
              travelMode={options.travelMode}
              lunchBreak={options.lunchBreak}
              regeneratingDate={regeneratingDate}
              onRegenerateDay={handleRegenerateDay}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t px-6 py-4">
          {phase === "options" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!!blocker || options.dayStart >= options.dayEnd}
                className="gap-2"
              >
                <Sparkles className="size-4" aria-hidden />
                Générer
              </Button>
            </>
          )}

          {phase === "preview" && (
            <>
              <Button
                variant="ghost"
                className="mr-auto gap-2"
                disabled={regeneratingDate !== null || isApplying}
                onClick={() => setPhase("options")}
              >
                <RotateCcw className="size-4" aria-hidden />
                Modifier les options
              </Button>
              <Button
                variant="outline"
                disabled={regeneratingDate !== null || isApplying}
                onClick={handleGenerate}
              >
                Tout régénérer
              </Button>
              <Button
                onClick={handleApply}
                disabled={stepCount === 0 || regeneratingDate !== null || isApplying}
                className="gap-2"
              >
                {isApplying ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
                Ajouter au calendrier ({stepCount})
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
