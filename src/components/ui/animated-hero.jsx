"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import React from "react"
import { StardustButton } from "./stardust-button";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();
  const titles = [
    "amazing",
    "new",
    "valuable",
    "sustainable",
    "community-driven",
  ]
  const [titleIndex, setTitleIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [titles.length])

  return (
    <div className="relative isolate z-10 mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
          Swap for something{" "}
          <motion.span
            key={titles[titleIndex]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-primary dark:text-sky-400 inline-block"
          >
            {titles[titleIndex]}
          </motion.span>
        </h1>
        <p className="mt-6 text-xl leading-8 text-muted-foreground">
          SwapCircle streamlines bartering. Discover amazing items, propose
          trades, and connect with your community – making exchange easier,
          faster, and more sustainable than ever.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
           <StardustButton onClick={() => router.push('/items')}>
              Start Swapping Now
            </StardustButton>
        </div>
      </div>
    </div>
  )
}
