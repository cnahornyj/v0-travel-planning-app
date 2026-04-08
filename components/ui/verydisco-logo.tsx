"use client"

import { cn } from "@/lib/utils"

interface VeryDiscoLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function VeryDiscoLogo({ size = "md", className }: VeryDiscoLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }

  const globeContainerSizes = {
    sm: "w-[1em] h-[1em]",
    md: "w-[1em] h-[1em]",
    lg: "w-[1em] h-[1em]",
  }

  return (
    <span className={cn("inline-flex items-baseline font-bold tracking-tight", sizeClasses[size], className)}>
      <span className="text-foreground">verydisc</span>
      <span className={cn("relative inline-flex items-center justify-center rounded-full bg-primary self-center", globeContainerSizes[size])}>
        {/* Simplified globe icon sized to match "o" */}
        <svg
          viewBox="0 0 24 24"
          className="w-[0.75em] h-[0.75em] text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {/* Globe circle */}
          <circle cx="12" cy="12" r="9" className="fill-white/20" />
          {/* Vertical meridian */}
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          {/* Horizontal lines */}
          <path d="M3.5 9h17" />
          <path d="M3.5 15h17" />
          {/* Highlight */}
          <circle cx="8" cy="8" r="1.5" className="fill-white/80 stroke-none" />
        </svg>
      </span>
    </span>
  )
}
