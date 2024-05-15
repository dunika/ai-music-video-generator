import {
  useEffect,
  useRef,
  useState,
} from 'react'
import MediaStreamManager from './MediaStreamManager'

const useMediaStream = (deviceId?: string) => {
  const managerRef = useRef<MediaStreamManager | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getStream = async () => {
      setError(null)
      if (!managerRef.current) {
        managerRef.current = new MediaStreamManager()
      }

      try {
        const fetchedStream = await managerRef.current?.fetchStream(deviceId)
        setStream(fetchedStream)
      } catch (err) {
        setError(err as Error)
        setStream(null)
      }
    }

    getStream()

    return () => {
      managerRef.current?.removeStreamByDeviceId(deviceId)
    }
  }, [deviceId])

  return {
    stream,
    error,
  }
}

export default useMediaStream
