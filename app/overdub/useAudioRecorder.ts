import useMediaStream, { FetchStatus } from './useMediaStream'
import useMediaStreamRecorder from './useMediaStreamRecorder'
import type { MediaStreamRecorder } from './useMediaStreamRecorder'

type UseAudioRecorder = {
  recorder: MediaStreamRecorder
  error: Error | null
}

const useAudioRecorder = (deviceId?: string): UseAudioRecorder => {
  const {
    stream,
    fetchStatus: streamFetchStatus,
    error: streamError,
  } = useMediaStream(deviceId)

  const { recorder, error: recorderError } = useMediaStreamRecorder(stream)

  const error = streamError || recorderError

  return {
    recorder,
    error: streamFetchStatus === FetchStatus.Pending ? null : error,
  }
}

export default useAudioRecorder
