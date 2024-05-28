import {
  useEffect,
  useRef,
  useState,
} from 'react'
import MediaStreamManager from './MediaStreamManager'
import { FetchStatus } from '.'

type UseMediaStream = {
  stream: MediaStream | null
  fetchStatus: FetchStatus
  error: Error | null
}

const useMediaStream = (deviceId?: string): UseMediaStream => {
  const managerRef = useRef<MediaStreamManager | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(FetchStatus.Pending)

  useEffect(() => {
    const fetchStream = async () => {
      setError(null)
      setFetchStatus(FetchStatus.Pending)

      if (!managerRef.current) {
        managerRef.current = new MediaStreamManager()
      }

      try {
        const fetchedStream = await managerRef.current?.fetchStream(deviceId)
        setStream(fetchedStream)
        setFetchStatus(FetchStatus.Success)
      } catch (err) {
        setError(err as Error)
        setStream(null)
        setFetchStatus(FetchStatus.Error)
      }
    }

    fetchStream()

    return () => {
      managerRef.current?.removeStreamByDeviceId(deviceId)
    }
  }, [deviceId])

  return {
    stream,
    fetchStatus,
    error,
  }
}

export default useMediaStream
