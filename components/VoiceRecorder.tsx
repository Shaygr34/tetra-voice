'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { startRecording, stopRecording } from '@/lib/audio'
import type { RecorderState } from '@/lib/types'
import WaveformVisualizer from './WaveformVisualizer'
import TranscriptReview from './TranscriptReview'

const MAX_DURATION = 5 * 60 // 5 minutes

export default function VoiceRecorder({ token }: { token: string }) {
  const [state, setState] = useState<RecorderState>('idle')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const handleStartRecording = useCallback(async () => {
    try {
      const { mediaRecorder, analyser, stream, audioContext } =
        await startRecording()

      mediaRecorderRef.current = mediaRecorder
      streamRef.current = stream
      audioContextRef.current = audioContext
      setAnalyser(analyser)
      setDuration(0)

      mediaRecorder.start()
      setState('recording')

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= MAX_DURATION - 1) {
            handleStopRecording()
            return d
          }
          return d + 1
        })
      }, 1000)
    } catch {
      setErrorMsg('יש לאפשר גישה למיקרופון בהגדרות הדפדפן')
      setState('error')
    }
  }, [])

  const handleStopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!mediaRecorderRef.current || !streamRef.current || !audioContextRef.current) return

    setState('transcribing')
    setAnalyser(null)

    const blob = await stopRecording(
      mediaRecorderRef.current,
      streamRef.current,
      audioContextRef.current,
    )
    audioBlobRef.current = blob

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Transcription failed')

      const data = await res.json()
      setTranscript(data.text)
      setState('review')
    } catch {
      setErrorMsg('שגיאה בעיבוד ההקלטה. נסה שוב.')
      setState('error')
    }
  }, [])

  const handleSend = useCallback(async () => {
    setState('submitting')

    try {
      const res = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, transcript }),
      })

      if (!res.ok) throw new Error('Submit failed')

      setState('submitted')
      setTimeout(() => {
        setState('idle')
        setTranscript('')
        setDuration(0)
      }, 4000)
    } catch {
      setErrorMsg('שגיאה בשליחה. נסה שוב.')
      setState('error')
    }
  }, [token, transcript])

  const handleReRecord = useCallback(() => {
    setTranscript('')
    setDuration(0)
    audioBlobRef.current = null
    setState('idle')
  }, [])

  const handleRetry = useCallback(() => {
    setErrorMsg('')
    if (audioBlobRef.current && transcript) {
      setState('review')
    } else {
      setState('idle')
    }
  }, [transcript])

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // --- RENDER ---

  if (state === 'submitted') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 flex-1">
        <div className="w-20 h-20 rounded-full bg-[#0F6E56]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#0F6E56]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-gray-700 text-lg font-medium text-center px-8">
          ההודעה נשלחה!
          <br />
          <span className="text-gray-400 text-base font-normal">שי יקבל עדכון.</span>
        </p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 flex-1 px-6">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center">{errorMsg}</p>
        <button
          onClick={handleRetry}
          className="bg-[#0F6E56] text-white font-medium py-2.5 px-8 rounded-xl hover:bg-[#0b5a46] transition-colors"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  if (state === 'review' || state === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <TranscriptReview
          transcript={transcript}
          onSend={handleSend}
          onReRecord={handleReRecord}
          submitting={state === 'submitting'}
        />
      </div>
    )
  }

  if (state === 'transcribing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 flex-1">
        <div className="w-12 h-12 border-4 border-[#0F6E56]/20 border-t-[#0F6E56] rounded-full animate-spin" />
        <p className="text-gray-500">...מעבד את ההקלטה</p>
      </div>
    )
  }

  // IDLE or RECORDING
  return (
    <div className="flex flex-col items-center justify-center gap-6 flex-1">
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-3">
          <WaveformVisualizer analyser={analyser} />
          <p className="text-red-400 font-mono text-lg tabular-nums">
            {formatDuration(duration)}
          </p>
        </div>
      )}

      <button
        onClick={state === 'idle' ? handleStartRecording : handleStopRecording}
        className={`
          w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg
          ${state === 'recording'
            ? 'bg-red-500 shadow-red-200 scale-110 animate-pulse'
            : 'bg-[#0F6E56] shadow-[#0F6E56]/20 hover:scale-105 active:scale-95'
          }
        `}
      >
        {state === 'recording' ? (
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      <p className="text-gray-400 text-sm">
        {state === 'recording' ? 'לחץ לעצור' : 'לחץ כדי להקליט'}
      </p>
    </div>
  )
}
