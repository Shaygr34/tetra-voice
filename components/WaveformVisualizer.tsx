'use client'

import { useEffect, useRef, useState } from 'react'
import { getAmplitudes } from '@/lib/audio'

const BAR_COUNT = 7

export default function WaveformVisualizer({
  analyser,
}: {
  analyser: AnalyserNode | null
}) {
  const [amplitudes, setAmplitudes] = useState<number[]>(
    Array(BAR_COUNT).fill(0.1),
  )
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!analyser) return

    function update() {
      const amps = getAmplitudes(analyser!, BAR_COUNT)
      setAmplitudes(amps)
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {amplitudes.map((amp, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-red-400 transition-all duration-75"
          style={{
            height: `${Math.max(8, amp * 48)}px`,
          }}
        />
      ))}
    </div>
  )
}
