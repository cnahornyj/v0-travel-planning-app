"use client"

import { Sparkles } from "lucide-react"
import type { Place } from "./travel-planner"
import { FIELD_LABELS, getMissingFields } from "@/lib/place-completeness"

interface MissingInfoIndicatorProps {
  place: Place
  onClick: () => void
}

export function MissingInfoIndicator({ place, onClick }: MissingInfoIndicatorProps) {
  const missing = getMissingFields(place)
  if (missing.length === 0) return null

  const list = missing.map((field) => FIELD_LABELS[field]).join(", ")
  const label = `${missing.length} information${missing.length > 1 ? "s" : ""} manquante${missing.length > 1 ? "s" : ""} : ${list}`

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}. Cliquer pour compléter.`}
      aria-label={`${label}. Ouvrir la fiche pour compléter.`}
      className="mr-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
    >
      <Sparkles className="size-2.5" aria-hidden="true" />
      {missing.length}
    </button>
  )
}
