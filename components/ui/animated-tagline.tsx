"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Map each character for the animated word
// Verydisco: V(0) e(1) r(2) y(3) d(4) i(5) s(6) c(7) o(8)
// Discovery: D(0) i(1) s(2) c(3) o(4) v(5) e(6) r(7) y(8)
const letterMappings = [
  { fromChar: "V", toChar: "D", fromPos: 0, toPos: 0 },
  { fromChar: "e", toChar: "i", fromPos: 1, toPos: 1 },
  { fromChar: "r", toChar: "s", fromPos: 2, toPos: 2 },
  { fromChar: "y", toChar: "c", fromPos: 3, toPos: 3 },
  { fromChar: "d", toChar: "o", fromPos: 4, toPos: 4 },
  { fromChar: "i", toChar: "v", fromPos: 5, toPos: 5 },
  { fromChar: "s", toChar: "e", fromPos: 6, toPos: 6 },
  { fromChar: "c", toChar: "r", fromPos: 7, toPos: 7 },
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
    <p className="text-2xl font-medium text-muted-foreground flex items-baseline justify-center font-mono tracking-tight">
      <span className="inline-flex">
        {letterMappings.map((letter, i) => (
          <motion.span
            key={i}
            className="inline-block w-[1ch] text-center"
            initial={false}
            animate={{
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 0.6,
              times: [0, 0.5, 1],
              delay: i * 0.05,
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
