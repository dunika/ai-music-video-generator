import {
  useEffect,
  useState,
} from 'react'
import { fetchAvailableAudioDevices } from './mediaDevices'

const useAvailableAudioDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  useEffect(() => {
    const updateAudioDevices = () => fetchAvailableAudioDevices().then(setDevices)

    navigator.mediaDevices.addEventListener('devicechange', updateAudioDevices)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateAudioDevices)
    }
  }, [])

  return devices
}

export default useAvailableAudioDevices
