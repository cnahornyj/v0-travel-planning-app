"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Letter positions for "Verydisco" -> "Discovery"
// Verydisco: V(0) e(1) r(2) y(3) d(4) i(5) s(6) c(7) o(8)
// Discovery: D(0) i(1) s(2) c(3) o(4) v(5) e(6) r(7) y(8)

const letters = [
  { char: "V", fromIndex: 0, toIndex: 5, toChar: "v" },
  { char: "e", fromIndex: 1, toIndex: 6, toChar: "e" },
  { char: "r", fromIndex: 2, toIndex: 7, toChar: "r" },
  { char: "y", fromIndex: 3, toIndex: 8, toChar: "y" },
  { char: "d", fromIndex: 4, toIndex: 0, toChar: "D" },
  { char: "i", fromIndex: 5, toIndex: 1, toChar: "i" },
  { char: "s", fromIndex: 6, toIndex: 2, toChar: "s" },
  { char: "c", fromIndex: 7, toIndex: 3, toChar: "c" },
  { char: "o", fromIndex: 8, toIndex: 4, toChar: "o" },
]

export function AnimatedTagline() {
  const [isDiscovery, setIsDiscovery] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDiscovery((prev) => !prev)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Calculate position offset based on character width (approx 0.6em per char)
  const getOffset = (fromIndex: number, toIndex: number) => {
    const diff = toIndex - fromIndex
    return diff * 0.6 // em units
  }

  return (
    <p className="text-sm text-muted-foreground italic h-6 flex items-center justify-center">
      <span className="relative inline-flex" style={{ width: "9ch" }}>
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: `${letter.fromIndex * 0.6}em` }}
            animate={{
              x: isDiscovery ? `${getOffset(letter.fromIndex, letter.toIndex)}em` : 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              delay: i * 0.03,
            }}
          >
            {isDiscovery ? letter.toChar : letter.char}
          </motion.span>
        ))}
      </span>
      <span className="ml-1">your next adventure</span>
    </p>
  )
}
