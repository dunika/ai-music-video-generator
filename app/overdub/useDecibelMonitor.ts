import {
  useRef,
  useEffect,
  useState,
} from 'react'
import DecibelMonitor from './DecibelMonitor'
import {
  fetchMediaStream,
  cleanupMediaStream,
} from './mediaDevices'

type UseDecibelMonitorProps = {
  deviceId?: string;
  decibelUpdateInterval: number;
};

type UseDecibelMonitor = {
  decibels: number | null;
  error: Error | null;
}

export const useDecibelMonitor = ({
  deviceId,
  decibelUpdateInterval,
}: UseDecibelMonitorProps): UseDecibelMonitor => {
  const [decibels, setDecibels] = useState<number | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const setupStream = async () => {
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current)
      }
      setError(null)
      try {
        const newStream = await fetchMediaStream(deviceId)
        setStream(newStream)
        streamRef.current = newStream
      } catch (err) {
        setError(err as Error)
      }
    }

    setupStream()

    return () => {
      cleanupMediaStream(streamRef.current)
    }
  }, [deviceId])

  useEffect(() => {
    if (stream) {
      const monitor = new DecibelMonitor(stream, decibelUpdateInterval)
      monitor.subscribe(setDecibels)

      return () => {
        monitor.destroy()
      }
    }
  }, [stream, decibelUpdateInterval])

  return {
    decibels,
    error,
  }
}
