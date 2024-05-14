import {
  useEffect,
  useState,
} from 'react'
import DecibelMonitor from './DecibelMonitor'

type UseDecibelMonitorProps = {
  stream: MediaStream | null;
  decibelUpdateInterval: number;
};

export const useDecibelMonitor = ({
  stream,
  decibelUpdateInterval,
}: UseDecibelMonitorProps): number | null => {
  const [decibels, setDecibels] = useState<number | null>(null)

  useEffect(() => {
    if (stream) {
      const monitor = new DecibelMonitor(stream, decibelUpdateInterval)
      monitor.subscribe(setDecibels)
      return monitor.destroy
    }
    // Reset decibels when stream is null
    setDecibels(null)
  }, [stream, decibelUpdateInterval])

  return decibels
}
