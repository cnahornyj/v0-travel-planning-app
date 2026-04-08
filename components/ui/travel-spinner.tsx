"use client"

import { cn } from "@/lib/utils"

interface TravelSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
  className?: string
}

export function TravelSpinner({ size = "md", message, className }: TravelSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer rotating ring - represents globe/orbit */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" 
             style={{ animationDuration: "1.5s" }} />
        
        {/* Middle pulsing ring */}
        <div className="absolute inset-1.5 animate-pulse rounded-full border border-primary/30" 
             style={{ animationDuration: "2s" }} />
        
        {/* Inner compass element */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-1/2 w-1/2 animate-spin text-primary"
            style={{ animationDuration: "3s", animationDirection: "reverse" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {/* Compass rose / navigation symbol */}
            <circle cx="12" cy="12" r="3" className="fill-primary/20" />
            <path d="M12 2L12 6" strokeLinecap="round" />
            <path d="M12 18L12 22" strokeLinecap="round" />
            <path d="M2 12L6 12" strokeLinecap="round" />
            <path d="M18 12L22 12" strokeLinecap="round" />
            {/* Compass needle */}
            <path d="M12 8L14 12L12 16L10 12Z" className="fill-primary" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Decorative dots orbiting - like destinations on a globe */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s" }}>
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDelay: "-2s" }}>
          <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/60" />
        </div>
      </div>

      {message && (
        <p className={cn("animate-pulse text-muted-foreground", textSizeClasses[size])}>
          {message}
        </p>
      )}
    </div>
  )
}
