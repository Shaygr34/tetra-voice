import { createClient } from '@supabase/supabase-js'
import ProjectHeader from '@/components/ProjectHeader'
import VoiceRecorder from '@/components/VoiceRecorder'

export default async function VoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Use anon key for reads (RLS allows it), service role only for writes in API routes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, slug, language')
    .eq('token', token)
    .single()

  if (!project) {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const keyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) || 'MISSING'
    console.error('Project lookup failed:', { token, error, hasUrl, hasKey, keyPreview })

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">הקישור לא תקין</p>
        <p className="text-xs text-gray-300 mt-4">{JSON.stringify({ error: error?.message, hasUrl, hasKey, keyPreview })}</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white" dir="rtl">
      <ProjectHeader name={project.name} />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <VoiceRecorder token={token} />
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-gray-300">Tetra by Dodeca</p>
      </footer>
    </div>
  )
}
