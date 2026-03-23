export type RecorderState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'review'
  | 'submitting'
  | 'submitted'
  | 'error'

export interface Project {
  id: string
  name: string
  slug: string
  language: string
  phase: string
}

export interface TranscriptionResult {
  text: string
  language: string
}

export interface EntryResult {
  success: boolean
  entryId?: string
  error?: string
}
