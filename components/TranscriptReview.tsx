'use client'

export default function TranscriptReview({
  transcript,
  onSend,
  onReRecord,
  submitting,
}: {
  transcript: string
  onSend: () => void
  onReRecord: () => void
  submitting: boolean
}) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 px-4">
      <p className="text-gray-500 text-sm">בדוק את התמלול ושלח</p>

      <div className="w-full bg-gray-50 rounded-2xl p-5 text-right leading-relaxed text-gray-800 text-base min-h-[100px] border border-gray-100">
        {transcript}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onSend}
          disabled={submitting}
          className="flex-1 bg-[#0F6E56] text-white font-semibold py-3.5 rounded-xl text-lg hover:bg-[#0b5a46] transition-colors disabled:opacity-60"
        >
          {submitting ? '...שולח' : 'שלח'}
        </button>
        <button
          onClick={onReRecord}
          disabled={submitting}
          className="flex-1 border border-gray-300 text-gray-600 font-medium py-3.5 rounded-xl text-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          הקלט מחדש
        </button>
      </div>
    </div>
  )
}
