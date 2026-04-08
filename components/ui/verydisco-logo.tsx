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
      <svg
        viewBox="0 0 24 24"
        className={cn("self-center", globeContainerSizes[size])}
        fill="none"
        strokeWidth="1.5"
      >
        {/* Globe circle filled with grey */}
        <circle cx="12" cy="12" r="11" fill="#5F5F5F" stroke="none" />
        {/* Vertical meridian */}
        <ellipse cx="12" cy="12" rx="4" ry="9" stroke="white" fill="none" />
        {/* Horizontal lines */}
        <path d="M3.5 9h17" stroke="white" />
        <path d="M3.5 15h17" stroke="white" />
        {/* Globe outline */}
        <circle cx="12" cy="12" r="9" fill="none" stroke="white" />
      </svg>
    </span>
  )
}
