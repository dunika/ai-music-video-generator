import {
  useEffect,
  useState,
} from 'react'
import DecibelMonitor from './DecibelMonitor'

type UseDecibelMonitorProps = {
  stream?: MediaStream;
  decibelUpdateInterval: number;
};

export const useDecibelMonitor = ({
  stream,
  decibelUpdateInterval,
}: UseDecibelMonitorProps): number | null => {
  const [decibels, setDecibels] = useState<number | null>(null)

  useEffect(() => {
    let monitor = null
    if (stream) {
      monitor = new DecibelMonitor(stream, decibelUpdateInterval)
      monitor.subscribe(setDecibels)
    } else {
      setDecibels(null)
    }

    return () => {
      monitor?.destroy()
    }
  }, [stream, decibelUpdateInterval])

  return decibels
}
