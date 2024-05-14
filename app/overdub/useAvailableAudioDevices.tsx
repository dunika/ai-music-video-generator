import {
  useEffect,
  useState,
} from 'react'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.js'

const useAvailableAudioDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  useEffect(() => {
    const getAvailableAudioDevices = () => {
      RecordPlugin.getAvailableAudioDevices().then(setDevices)
    }

    getAvailableAudioDevices()

    navigator.mediaDevices.addEventListener('devicechange', getAvailableAudioDevices)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAvailableAudioDevices)
    }
  }, [])

  return devices
}

export default useAvailableAudioDevices
