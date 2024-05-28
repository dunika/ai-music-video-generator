import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import useEvent from 'react-use-event-hook'

type RecordingState = 'inactive' | 'paused' | 'recording';

export type MediaStreamRecorder = {
  blob: Blob[]
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  state: RecordingState
}

type UseMediaStreamRecorder = {
  recorder: MediaStreamRecorder
  error: Error | null
}

const useMediaStreamRecorder = (
  stream?: MediaStream | null,
): UseMediaStreamRecorder => {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob[]>([])
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')
  const [error, setError] = useState<Error | null>(null)

  const initializeMediaRecorder = useCallback(() => {
    if (!stream) {
      setError(new Error('No media stream provided'))
      return
    }

    setError(null)
    setRecordingBlob([])

    const nextMediaRecorder = new MediaRecorder(stream)

    const updateState = () => setRecordingState(nextMediaRecorder.state as RecordingState)

    nextMediaRecorder.onstart = updateState
    nextMediaRecorder.onstop = updateState
    nextMediaRecorder.onpause = updateState
    nextMediaRecorder.onresume = updateState
    nextMediaRecorder.onerror = (event) => {
      updateState()
      setError(event.error)
    }
    nextMediaRecorder.ondataavailable = (event) => {
      setRecordingBlob((chunks) => [...chunks, event.data])
    }

    mediaRecorder.current = nextMediaRecorder
  }, [stream])

  useEffect(() => {
    return () => {
      mediaRecorder.current?.stop()
    }
  }, [stream])

  const start = useEvent(() => {
    if (recordingState !== 'inactive') {
      return
    }
    initializeMediaRecorder()
    mediaRecorder.current?.start()
  })

  const stop = useEvent(() => {
    if (!error && recordingState === 'inactive') {
      return
    }
    mediaRecorder.current?.stop()
  })

  const pause = useEvent(() => {
    if (!error && recordingState !== 'recording') {
      return
    }
    mediaRecorder.current?.pause()
  })

  const resume = useEvent(() => {
    if (!error && recordingState !== 'paused') {
      return
    }
    mediaRecorder.current?.resume()
  })

  const recorder = {
    start,
    stop,
    pause,
    resume,
    blob: recordingBlob,
    state: recordingState,
  }

  return {
    recorder,
    error,
  }
}

export default useMediaStreamRecorder
