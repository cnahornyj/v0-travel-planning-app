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
    sm: "w-[0.75em] h-[0.75em]",
    md: "w-[0.75em] h-[0.75em]",
    lg: "w-[0.75em] h-[0.75em]",
  }

  return (
    <span className={cn("inline-flex items-baseline font-bold tracking-tight text-white", sizeClasses[size], className)}>
      <span>verydisc</span>
      <svg
        viewBox="0 0 24 24"
        className={cn("self-center", globeContainerSizes[size])}
        fill="none"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        {/* Vertical meridian */}
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        {/* Horizontal lines */}
        <path d="M3.5 9h17" />
        <path d="M3.5 15h17" />
        {/* Globe outline */}
        <circle cx="12" cy="12" r="9" />
      </svg>
    </span>
  )
}
