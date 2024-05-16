import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import useEvent from 'react-use-event-hook'

type RecordingState = 'inactive' | 'paused' | 'recording';

const useMediaRecorder = (
  stream: MediaStream,
) => {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob[]>([])
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')
  const [error, setError] = useState<Error | null>(null)

  const initializeMediaRecorder = useCallback(() => {
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

  const startRecording = useEvent(() => {
    if (recordingState !== 'inactive') {
      return
    }
    initializeMediaRecorder()
    mediaRecorder.current?.start()
  })

  const stopRecording = useEvent(() => {
    if (!error && recordingState === 'inactive') {
      return
    }
    mediaRecorder.current?.stop()
  })

  const pauseRecording = useEvent(() => {
    if (!error && recordingState !== 'recording') {
      return
    }
    mediaRecorder.current?.pause()
  })

  const resumeRecording = useEvent(() => {
    if (!error && recordingState !== 'paused') {
      return
    }
    mediaRecorder.current?.resume()
  })

  return {
    recordingBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordingState,
    recordingError: error,
  }
}

export default useMediaRecorder
