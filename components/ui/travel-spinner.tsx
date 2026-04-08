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

        {/* Center disco globe */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("relative", globeSizes[size])}>
            <svg
              viewBox="0 0 50 50"
              className="h-full w-full animate-spin text-primary"
              style={{ animationDuration: "4s" }}
            >
              <defs>
                {/* Gradient for shimmer effect */}
                <linearGradient id="shimmer1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="shimmer2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
                </linearGradient>
                {/* Clip path for globe shape */}
                <clipPath id="globeClip">
                  <circle cx="25" cy="25" r="20" />
                </clipPath>
              </defs>
              
              {/* Globe base */}
              <circle cx="25" cy="25" r="20" fill="currentColor" opacity="0.15" />
              
              {/* Disco facets - horizontal bands */}
              <g clipPath="url(#globeClip)">
                {/* Row 1 - top */}
                <rect x="5" y="6" width="8" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0s", animationDuration: "0.8s" }} />
                <rect x="14" y="6" width="8" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.2s", animationDuration: "0.6s" }} />
                <rect x="23" y="6" width="8" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "0.9s" }} />
                <rect x="32" y="6" width="8" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.1s", animationDuration: "0.7s" }} />
                
                {/* Row 2 */}
                <rect x="3" y="12" width="7" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.3s", animationDuration: "0.5s" }} />
                <rect x="11" y="12" width="7" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "0.8s" }} />
                <rect x="19" y="12" width="7" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.1s", animationDuration: "0.6s" }} />
                <rect x="27" y="12" width="7" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "0.9s" }} />
                <rect x="35" y="12" width="7" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.2s", animationDuration: "0.7s" }} />
                
                {/* Row 3 - middle top */}
                <rect x="5" y="18" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.6s", animationDuration: "0.6s" }} />
                <rect x="12" y="18" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0s", animationDuration: "0.8s" }} />
                <rect x="19" y="18" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.3s", animationDuration: "0.5s" }} />
                <rect x="26" y="18" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "0.9s" }} />
                <rect x="33" y="18" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.2s", animationDuration: "0.7s" }} />
                
                {/* Row 4 - equator */}
                <rect x="5" y="24" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.1s", animationDuration: "0.7s" }} />
                <rect x="12" y="24" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "0.6s" }} />
                <rect x="19" y="24" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.6s", animationDuration: "0.8s" }} />
                <rect x="26" y="24" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0s", animationDuration: "0.5s" }} />
                <rect x="33" y="24" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.3s", animationDuration: "0.9s" }} />
                
                {/* Row 5 - middle bottom */}
                <rect x="5" y="30" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.2s", animationDuration: "0.8s" }} />
                <rect x="12" y="30" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "0.6s" }} />
                <rect x="19" y="30" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.1s", animationDuration: "0.7s" }} />
                <rect x="26" y="30" width="6" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "0.9s" }} />
                <rect x="33" y="30" width="6" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.6s", animationDuration: "0.5s" }} />
                
                {/* Row 6 */}
                <rect x="3" y="36" width="7" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "0.6s" }} />
                <rect x="11" y="36" width="7" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.1s", animationDuration: "0.8s" }} />
                <rect x="19" y="36" width="7" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.3s", animationDuration: "0.5s" }} />
                <rect x="27" y="36" width="7" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.6s", animationDuration: "0.9s" }} />
                <rect x="35" y="36" width="7" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0s", animationDuration: "0.7s" }} />
                
                {/* Row 7 - bottom */}
                <rect x="5" y="42" width="8" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.5s", animationDuration: "0.7s" }} />
                <rect x="14" y="42" width="8" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.2s", animationDuration: "0.6s" }} />
                <rect x="23" y="42" width="8" height="5" fill="url(#shimmer2)" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "0.8s" }} />
                <rect x="32" y="42" width="8" height="5" fill="url(#shimmer1)" className="animate-pulse" style={{ animationDelay: "0.1s", animationDuration: "0.9s" }} />
              </g>
              
              {/* Globe outline and meridians for geography feel */}
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <ellipse cx="25" cy="25" rx="8" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <ellipse cx="25" cy="25" rx="20" ry="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              
              {/* Sparkle highlights */}
              <circle cx="15" cy="15" r="1.5" fill="white" opacity="0.9" className="animate-ping" style={{ animationDuration: "1.5s" }} />
              <circle cx="32" cy="20" r="1" fill="white" opacity="0.7" className="animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
              <circle cx="20" cy="32" r="1.2" fill="white" opacity="0.8" className="animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
              <circle cx="35" cy="30" r="0.8" fill="white" opacity="0.6" className="animate-ping" style={{ animationDuration: "2.2s", animationDelay: "0.7s" }} />
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
