export const fetchMediaStream = (deviceId?: string): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId } : true,
  })
}

export const fetchAvailableAudioDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'audioinput')
}

export const cleanupMediaStream = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => track.stop())
}
