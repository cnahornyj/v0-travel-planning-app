"use client"

import { useState } from "react"
import { Sparkles, Check, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Place } from "./travel-planner"
import { FIELD_LABELS, getMissingFields, type CompletableField } from "@/lib/place-completeness"

type Source = "google" | "ai"
type Suggestions = Partial<Record<CompletableField, { value: unknown; source: Source }>>

interface PlaceEnrichmentProps {
  place: Place
  onApply: (updates: Partial<Place>) => Promise<void> | void
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return `${Math.floor(minutes / 60)}h${rest > 0 ? ` ${rest}min` : ""}`
}

function SuggestionPreview({ field, value }: { field: CompletableField; value: unknown }) {
  switch (field) {
    case "openingHours":
      return (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {(value as string[]).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )
    case "estimatedDuration":
      return <p className="text-sm text-muted-foreground">{formatDuration(value as number)}</p>
    case "photos":
      return (
        <div className="flex gap-1.5 overflow-x-auto">
          {(value as string[]).map((src) => (
            <img key={src} src={src || "/placeholder.svg"} alt="" className="size-14 shrink-0 rounded-md object-cover" />
          ))}
        </div>
      )
    case "website":
      return <p className="truncate text-sm text-primary">{value as string}</p>
    default:
      return <p className="text-sm text-muted-foreground">{value as string}</p>
  }
}

export function PlaceEnrichment({ place, onApply }: PlaceEnrichmentProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "review" | "applying">("idle")
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestions>({})
  const [selected, setSelected] = useState<Set<CompletableField>>(new Set())

  const missing = getMissingFields(place)
  if (missing.length === 0 && status === "idle") return null

  const handleEnrich = async () => {
    setStatus("loading")
    setError(null)
    try {
      const response = await fetch("/api/places/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: { id: place.id, name: place.name, address: place.address, type: place.type, tags: place.tags },
          missing,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erreur inconnue")

      const result: Suggestions = data.suggestions || {}
      const fields = Object.keys(result) as CompletableField[]
      if (fields.length === 0) {
        setError("Aucune information fiable n'a été trouvée pour ce lieu.")
        setStatus("idle")
        return
      }
      setSuggestions(result)
      setSelected(new Set(fields))
      setStatus("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setStatus("idle")
    }
  }

  const toggle = (field: CompletableField) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }

  const handleApply = async () => {
    const updates: Partial<Place> = {}
    for (const field of selected) {
      const suggestion = suggestions[field]
      if (!suggestion) continue
      if (field === "openingHours") {
        updates.openingHours = { periods: place.openingHours?.periods ?? [], weekdayText: suggestion.value as string[] }
      } else if (field === "estimatedDuration") {
        updates.estimatedDuration = suggestion.value as number
      } else if (field === "photos") {
        updates.photos = suggestion.value as string[]
      } else {
        updates[field] = suggestion.value as string
      }
    }
    setStatus("applying")
    try {
      await onApply(updates)
      setSuggestions({})
      setStatus("idle")
    } catch {
      setError("Impossible d'enregistrer les modifications.")
      setStatus("review")
    }
  }

  if (status === "review" || status === "applying") {
    const fields = Object.keys(suggestions) as CompletableField[]
    return (
      <section aria-label="Suggestions de l'IA" className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Suggestions</h3>
          <span className="text-xs text-muted-foreground">Vérifiez avant d&apos;appliquer</span>
        </div>

        <ul className="space-y-2">
          {fields.map((field) => {
            const suggestion = suggestions[field]!
            const id = `enrich-${field}`
            return (
              <li key={field} className="flex gap-3 rounded-md border bg-card p-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={selected.has(field)}
                  onChange={() => toggle(field)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    {FIELD_LABELS[field]}
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                      {suggestion.source === "google" ? "Google" : "Estimation IA"}
                    </Badge>
                  </label>
                  <SuggestionPreview field={field} value={suggestion.value} />
                </div>
              </li>
            )
          })}
        </ul>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleApply} disabled={selected.size === 0 || status === "applying"}>
            {status === "applying" ? (
              <Loader2 className="mr-2 size-3 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="mr-2 size-3" aria-hidden="true" />
            )}
            Appliquer ({selected.size})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSuggestions({})
              setStatus("idle")
            }}
            disabled={status === "applying"}
          >
            <X className="mr-2 size-3" aria-hidden="true" />
            Ignorer
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Informations manquantes"
      className="flex flex-col gap-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1.5">
        <p className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="size-4 text-amber-500" aria-hidden="true" />
          {missing.length} information{missing.length > 1 ? "s" : ""} manquante{missing.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-1">
          {missing.map((field) => (
            <Badge key={field} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              {FIELD_LABELS[field]}
            </Badge>
          ))}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button size="sm" onClick={handleEnrich} disabled={status === "loading"} className="shrink-0">
        {status === "loading" ? (
          <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="mr-2 size-3.5" aria-hidden="true" />
        )}
        {status === "loading" ? "Recherche..." : "Compléter avec l'IA"}
      </Button>
    </section>
  )
}
