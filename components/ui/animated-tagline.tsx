"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Full sentence: "Verydisco of your next adventure" <-> "Discovery of your next adventure"
const fromSentence = "Verydisco of your next adventure"
const toSentence = "Discovery of your next adventure"

// Map each character position for the animated part (first 9 chars)
// Verydisco: V(0) e(1) r(2) y(3) d(4) i(5) s(6) c(7) o(8)
// Discovery: D(0) i(1) s(2) c(3) o(4) v(5) e(6) r(7) y(8)
const letterMappings = [
  { fromChar: "V", toChar: "D", fromPos: 0, toPos: 4 },
  { fromChar: "e", toChar: "i", fromPos: 1, toPos: 5 },
  { fromChar: "r", toChar: "s", fromPos: 2, toPos: 6 },
  { fromChar: "y", toChar: "c", fromPos: 3, toPos: 7 },
  { fromChar: "d", toChar: "o", fromPos: 4, toPos: 0 },
  { fromChar: "i", toChar: "v", fromPos: 5, toPos: 1 },
  { fromChar: "s", toChar: "e", fromPos: 6, toPos: 2 },
  { fromChar: "c", toChar: "r", fromPos: 7, toPos: 3 },
  { fromChar: "o", toChar: "y", fromPos: 8, toPos: 8 },
]

const staticPart = " of your next adventure"

export function AnimatedTagline() {
  const [isDiscovery, setIsDiscovery] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDiscovery((prev) => !prev)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <p className="text-xl font-medium text-muted-foreground h-10 flex items-center justify-center font-mono">
      <span className="relative h-8" style={{ width: "9ch" }}>
        {letterMappings.map((letter, i) => (
          <motion.span
            key={i}
            className="absolute inline-block text-center"
            style={{ 
              width: "1ch",
              left: `${letter.fromPos}ch`,
            }}
            animate={{
              x: isDiscovery 
                ? `${letter.toPos - letter.fromPos}ch` 
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
      <span>{staticPart}</span>
    </p>
  )
}
