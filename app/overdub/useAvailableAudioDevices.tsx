import {
  useEffect,
  useState,
} from 'react'

const fetchAvailableAudioDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'audioinput')
}

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
