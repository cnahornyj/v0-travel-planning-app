"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
  className?: string
  showHexInput?: boolean
  error?: boolean
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

function normalizeHex(hex: string): string {
  // Remove # if present and convert to lowercase
  let cleaned = hex.replace("#", "").toLowerCase()
  
  // If 3 characters, expand to 6 (e.g., "abc" -> "aabbcc")
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("")
  }
  
  return `#${cleaned}`
}

export function ColorPicker({
  value,
  onChange,
  disabled = false,
  className,
  showHexInput = true,
  error = false,
}: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value
    
    // Ensure it starts with #
    if (!input.startsWith("#")) {
      input = "#" + input.replace("#", "")
    }
    
    // Limit to 7 characters (#XXXXXX)
    if (input.length > 7) {
      input = input.slice(0, 7)
    }
    
    setHexInput(input)
    
    // Only propagate valid hex colors
    const normalized = normalizeHex(input)
    if (isValidHex(normalized)) {
      onChange(normalized)
    }
  }

  const handleHexInputBlur = () => {
    // On blur, normalize or reset to current value
    const normalized = normalizeHex(hexInput)
    if (isValidHex(normalized)) {
      setHexInput(normalized)
      onChange(normalized)
    } else {
      setHexInput(value)
    }
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setHexInput(newColor)
    onChange(newColor)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={handleColorPickerChange}
          disabled={disabled}
          className={cn(
            "size-9 cursor-pointer rounded-md border bg-transparent p-1",
            disabled && "cursor-not-allowed opacity-50",
            error && "border-destructive"
          )}
          title="Choisir une couleur"
        />
      </div>
      {showHexInput && (
        <Input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          disabled={disabled}
          placeholder="#000000"
          className={cn(
            "w-24 font-mono text-xs uppercase",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          maxLength={7}
        />
      )}
    </div>
  )
}
