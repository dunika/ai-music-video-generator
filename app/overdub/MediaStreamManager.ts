import {
  fetchDefaultMediaStream,
  fetchMediaStream,
  getMediaStreamDeviceId,
  stopMediaStream,
} from './mediaStreamUtils'

const INITIAL_DEFAULT_DEVICE_KEY = 'default'

class MediaStreamManager {
  private defaultDeviceKey: string = INITIAL_DEFAULT_DEVICE_KEY

  private streams: { [key: string]: MediaStream } = {}

  public async fetchStream(deviceId?: string): Promise<MediaStream> {
    if (!deviceId) {
      return this.fetchDefaultDeviceStream()
    }

    const streamKey = deviceId
    if (this.streams[streamKey]) {
      return this.streams[streamKey]
    }

    const stream = await fetchMediaStream(deviceId)
    this.streams[deviceId] = stream
    return stream
  }

  public async fetchDefaultDeviceStream(): Promise<MediaStream> {
    if (this.streams[this.defaultDeviceKey]) {
      return this.streams[this.defaultDeviceKey]
    }

    const stream = await fetchDefaultMediaStream()
    const defaultDeviceId = getMediaStreamDeviceId(stream)

    if (defaultDeviceId) {
      this.defaultDeviceKey = defaultDeviceId
    }

    this.streams[this.defaultDeviceKey] = stream
    return stream
  }

  public findStreamDeviceId(stream: MediaStream): string | null {
    const entry = Object.entries(this.streams).find(
      ([, existingStream]) => existingStream === stream,
    )
    return entry ? entry[0] : null
  }

  public removeStream(stream: MediaStream) : void {
    stopMediaStream(stream)
    const deviceId = this.findStreamDeviceId(stream)
    if (deviceId) {
      delete this.streams[deviceId]
    }
  }

  public removeStreamByDeviceId(deviceId?: string): void {
    const streamKey = deviceId ?? this.defaultDeviceKey
    const stream = this.streams[streamKey]
    if (stream) {
      stopMediaStream(stream)
      delete this.streams[streamKey]
    }

    if (streamKey === this.defaultDeviceKey) {
      this.defaultDeviceKey = INITIAL_DEFAULT_DEVICE_KEY
    }
  }

  public destroy() : void {
    Object.values(this.streams).forEach(stopMediaStream)
    this.streams = {}
  }
}

export default MediaStreamManager
