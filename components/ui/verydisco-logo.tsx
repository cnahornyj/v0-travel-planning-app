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

  const globeSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-9 h-9",
  }

  const containerSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-10 h-10",
  }

  return (
    <span className={cn("inline-flex items-center font-bold tracking-tight", sizeClasses[size], className)}>
      <span className="text-foreground">verydisc</span>
      <span className={cn("relative inline-flex items-center justify-center rounded-full bg-primary", containerSizes[size])}>
        {/* Globe icon */}
        <svg
          viewBox="0 0 50 50"
          className={cn("text-white", globeSizes[size])}
        >
          <defs>
            <linearGradient id="logoShimmer1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
            </linearGradient>
            <clipPath id="logoGlobeClip">
              <circle cx="25" cy="25" r="20" />
            </clipPath>
          </defs>
          
          {/* Globe base */}
          <circle cx="25" cy="25" r="20" fill="currentColor" opacity="0.2" />
          
          {/* Disco facets */}
          <g clipPath="url(#logoGlobeClip)">
            <rect x="5" y="8" width="9" height="6" fill="url(#logoShimmer1)" opacity="0.9" />
            <rect x="15" y="8" width="9" height="6" fill="currentColor" opacity="0.5" />
            <rect x="25" y="8" width="9" height="6" fill="url(#logoShimmer1)" opacity="0.8" />
            <rect x="35" y="8" width="9" height="6" fill="currentColor" opacity="0.6" />
            
            <rect x="3" y="15" width="8" height="6" fill="currentColor" opacity="0.6" />
            <rect x="12" y="15" width="8" height="6" fill="url(#logoShimmer1)" opacity="0.9" />
            <rect x="21" y="15" width="8" height="6" fill="currentColor" opacity="0.5" />
            <rect x="30" y="15" width="8" height="6" fill="url(#logoShimmer1)" opacity="0.85" />
            <rect x="39" y="15" width="8" height="6" fill="currentColor" opacity="0.55" />
            
            <rect x="5" y="22" width="7" height="6" fill="url(#logoShimmer1)" opacity="0.85" />
            <rect x="13" y="22" width="7" height="6" fill="currentColor" opacity="0.55" />
            <rect x="21" y="22" width="7" height="6" fill="url(#logoShimmer1)" opacity="0.95" />
            <rect x="29" y="22" width="7" height="6" fill="currentColor" opacity="0.6" />
            <rect x="37" y="22" width="7" height="6" fill="url(#logoShimmer1)" opacity="0.8" />
            
            <rect x="5" y="29" width="7" height="6" fill="currentColor" opacity="0.5" />
            <rect x="13" y="29" width="7" height="6" fill="url(#logoShimmer1)" opacity="0.9" />
            <rect x="21" y="29" width="7" height="6" fill="currentColor" opacity="0.65" />
            <rect x="29" y="29" width="7" height="6" fill="url(#logoShimmer1)" opacity="0.85" />
            <rect x="37" y="29" width="7" height="6" fill="currentColor" opacity="0.5" />
            
            <rect x="3" y="36" width="8" height="6" fill="url(#logoShimmer1)" opacity="0.8" />
            <rect x="12" y="36" width="8" height="6" fill="currentColor" opacity="0.55" />
            <rect x="21" y="36" width="8" height="6" fill="url(#logoShimmer1)" opacity="0.9" />
            <rect x="30" y="36" width="8" height="6" fill="currentColor" opacity="0.6" />
            <rect x="39" y="36" width="8" height="6" fill="url(#logoShimmer1)" opacity="0.75" />
          </g>
          
          {/* Globe outline */}
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <ellipse cx="25" cy="25" rx="8" ry="20" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />
          <ellipse cx="25" cy="25" rx="20" ry="8" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />
          
          {/* Sparkle highlights */}
          <circle cx="15" cy="15" r="2" fill="white" opacity="0.9" />
          <circle cx="32" cy="20" r="1.2" fill="white" opacity="0.7" />
        </svg>
      </span>
    </span>
  )
}
