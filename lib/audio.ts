export async function startRecording(): Promise<{
  mediaRecorder: MediaRecorder
  analyser: AnalyserNode
  stream: MediaStream
  audioContext: AudioContext
}> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000,
    },
  })

  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/mp4'

  const mediaRecorder = new MediaRecorder(stream, { mimeType })

  return { mediaRecorder, analyser, stream, audioContext }
}

export function stopRecording(
  mediaRecorder: MediaRecorder,
  stream: MediaStream,
  audioContext: AudioContext,
): Promise<Blob> {
  return new Promise((resolve) => {
    const chunks: Blob[] = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      audioContext.close()
      resolve(new Blob(chunks, { type: mediaRecorder.mimeType }))
    }
    mediaRecorder.stop()
  })
}

export function getAmplitudes(analyser: AnalyserNode, barCount: number): number[] {
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)

  const step = Math.floor(dataArray.length / barCount)
  const amplitudes: number[] = []

  for (let i = 0; i < barCount; i++) {
    let sum = 0
    for (let j = 0; j < step; j++) {
      sum += dataArray[i * step + j]
    }
    amplitudes.push(sum / step / 255)
  }

  return amplitudes
}
