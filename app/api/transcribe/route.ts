import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audio, 'recording.webm')
    whisperForm.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperForm,
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Whisper API error:', err)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
    }

    const result = await response.json()
    return NextResponse.json({ text: result.text, language: result.language || 'he' })
  } catch (error) {
    console.error('Transcribe error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
