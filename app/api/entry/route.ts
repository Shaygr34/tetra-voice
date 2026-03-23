import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { token, transcript, language } = await request.json()

    if (!token || !transcript) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, phase')
      .eq('token', token)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 404 })
    }

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        project_id: project.id,
        intent: 'feedback',
        mode: 'feedback',
        raw_transcript: transcript,
        status: 'new',
      })
      .select()
      .single()

    if (entryError) {
      console.error('Supabase insert error:', entryError)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true, entryId: entry.id })
  } catch (error) {
    console.error('Entry error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
