"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Letter mappings for "Verydisco" <-> "Discovery" 
// Both words have exactly 9 letters, using fixed-width positioning
const letterWidth = 1.1 // rem per letter for consistent spacing

// Position mapping: which position each letter moves to
// Verydisco: V(0) e(1) r(2) y(3) d(4) i(5) s(6) c(7) o(8)
// Discovery: D(0) i(1) s(2) c(3) o(4) v(5) e(6) r(7) y(8)
const letters = [
  { fromChar: "V", toChar: "v", fromPos: 0, toPos: 5 },
  { fromChar: "e", toChar: "e", fromPos: 1, toPos: 6 },
  { fromChar: "r", toChar: "r", fromPos: 2, toPos: 7 },
  { fromChar: "y", toChar: "y", fromPos: 3, toPos: 8 },
  { fromChar: "d", toChar: "D", fromPos: 4, toPos: 0 },
  { fromChar: "i", toChar: "i", fromPos: 5, toPos: 1 },
  { fromChar: "s", toChar: "s", fromPos: 6, toPos: 2 },
  { fromChar: "c", toChar: "c", fromPos: 7, toPos: 3 },
  { fromChar: "o", toChar: "o", fromPos: 8, toPos: 4 },
]

export function AnimatedTagline() {
  const [isDiscovery, setIsDiscovery] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDiscovery((prev) => !prev)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const staticText = " of your next adventure"

  return (
    <p className="text-xl font-medium text-muted-foreground h-10 flex items-center justify-center">
      <span 
        className="relative inline-flex"
        style={{ width: `${9 * letterWidth}rem` }}
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            className="absolute text-center"
            style={{ 
              width: `${letterWidth}rem`,
              left: `${letter.fromPos * letterWidth}rem`,
            }}
            animate={{
              x: isDiscovery 
                ? `${(letter.toPos - letter.fromPos) * letterWidth}rem` 
                : 0,
            }}
            transition={{
              duration: 0.7,
              ease: [0.4, 0, 0.2, 1],
              delay: i * 0.04,
            }}
          >
            {isDiscovery ? letter.toChar : letter.fromChar}
          </motion.span>
        ))}
      </span>
      {staticText.split("").map((char, i) => (
        <span 
          key={i} 
          className="inline-block text-center"
          style={{ width: char === " " ? "0.4rem" : `${letterWidth}rem` }}
        >
          {char}
        </span>
      ))}
    </p>
  )
}
