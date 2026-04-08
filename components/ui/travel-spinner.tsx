"use client"

import { cn } from "@/lib/utils"

interface TravelSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
  className?: string
}

export function TravelSpinner({ size = "md", message, className }: TravelSpinnerProps) {
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-44 h-44",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const globeSizes = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Rotating outer ring with "DISCOVERY" text */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full animate-spin"
          style={{ animationDuration: "8s" }}
        >
          <defs>
            <path
              id="discoveryPath"
              d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
              fill="none"
            />
          </defs>
          {/* Decorative ring */}
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
          {/* Discovery text along the path */}
          <text className="fill-primary text-[8px] font-semibold uppercase tracking-[0.3em]">
            <textPath href="#discoveryPath" startOffset="0%">
              DISCOVERY • DISCOVERY • DISCOVERY •
            </textPath>
          </text>
        </svg>

        {/* Middle pulsing ring */}
        <div className="absolute inset-3 animate-pulse rounded-full border-2 border-primary/30" 
             style={{ animationDuration: "2s" }} />

        {/* Center globe */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("relative", globeSizes[size])}>
            <svg
              viewBox="0 0 24 24"
              className="h-full w-full animate-pulse text-primary"
              style={{ animationDuration: "3s" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              {/* Globe outer circle */}
              <circle cx="12" cy="12" r="10" className="fill-primary/10" />
              {/* Vertical meridian */}
              <ellipse cx="12" cy="12" rx="4" ry="10" />
              {/* Horizontal equator */}
              <ellipse cx="12" cy="12" rx="10" ry="4" />
              {/* Latitude lines */}
              <path d="M4 8.5h16" />
              <path d="M4 15.5h16" />
            </svg>
            
            {/* Orbiting dot around the globe */}
            <div 
              className="absolute inset-0 animate-spin" 
              style={{ animationDuration: "2s" }}
            >
              <div className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
            </div>
          </div>
        </div>

        {/* Outer decorative dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }}>
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/60" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse", animationDelay: "-3s" }}>
          <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/40" />
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
