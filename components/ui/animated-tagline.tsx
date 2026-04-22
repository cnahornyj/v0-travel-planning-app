"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Map each character position from Verydisco to Discovery
// Verydisco: V(0) e(1) r(2) y(3) d(4) i(5) s(6) c(7) o(8)
// Discovery: D(0) i(1) s(2) c(3) o(4) v(5) e(6) r(7) y(8)
// We track where each letter in Verydisco moves to in Discovery
const letterMappings = [
  { char: "V", fromPos: 0, toPos: 5, toChar: "v" },  // V -> v (position 5)
  { char: "e", fromPos: 1, toPos: 6, toChar: "e" },  // e -> e (position 6)
  { char: "r", fromPos: 2, toPos: 7, toChar: "r" },  // r -> r (position 7)
  { char: "y", fromPos: 3, toPos: 8, toChar: "y" },  // y -> y (position 8)
  { char: "d", fromPos: 4, toPos: 0, toChar: "D" },  // d -> D (position 0)
  { char: "i", fromPos: 5, toPos: 1, toChar: "i" },  // i -> i (position 1)
  { char: "s", fromPos: 6, toPos: 2, toChar: "s" },  // s -> s (position 2)
  { char: "c", fromPos: 7, toPos: 3, toChar: "c" },  // c -> c (position 3)
  { char: "o", fromPos: 8, toPos: 4, toChar: "o" },  // o -> o (position 4)
]

const staticPart = "of your next adventure"

export function AnimatedTagline() {
  const [isDiscovery, setIsDiscovery] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsDiscovery(true)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <p className="text-2xl font-medium text-muted-foreground flex items-center justify-center font-mono">
      <span 
        className="relative inline-flex h-8"
        style={{ width: "9ch" }}
      >
        {letterMappings.map((letter, i) => (
          <motion.span
            key={i}
            className="absolute inline-flex items-center justify-center w-[1ch] h-8"
            style={{ left: `${letter.fromPos}ch` }}
            animate={{
              x: isDiscovery ? `${(letter.toPos - letter.fromPos)}ch` : 0,
            }}
            transition={{
              duration: 0.7,
              ease: [0.4, 0, 0.2, 1],
              delay: i * 0.04,
            }}
          >
            {isDiscovery ? letter.toChar : letter.char}
          </motion.span>
        ))}
      </span>
      <span className="ml-3 h-8 inline-flex items-center">{staticPart}</span>
    </p>
  )
}
