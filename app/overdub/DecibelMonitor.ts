type UnsubscribeCallback = () => void

class DecibelMonitor {
  private audioContext: AudioContext

  private source: MediaStreamAudioSourceNode

  private analyser: AnalyserNode

  private dataArray: Float32Array

  private decibelUpdateInterval: number

  private timeoutId?: number

  private subscribers: Array<(_decibels: number) => void>

  constructor(
    stream: MediaStream,
    decibelUpdateInterval: number,
  ) {
    this.audioContext = new AudioContext()
    this.source = this.audioContext.createMediaStreamSource(stream)
    this.analyser = this.audioContext.createAnalyser()
    this.dataArray = new Float32Array(this.analyser.fftSize)
    // Configure the analyser
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10

    // Connect the source to the analyser
    this.source.connect(this.analyser)

    this.decibelUpdateInterval = decibelUpdateInterval

    this.subscribers = []
  }

  public subscribe = (onDecibelUpdate: (_decibels: number) => void): UnsubscribeCallback => {
    if (!this.subscribers.length) {
      this.start()
    }
    this.subscribers.push(onDecibelUpdate)
    return () => {
      this.unsubscribe(onDecibelUpdate)
    }
  }

  public unsubscribe = (onDecibelUpdate: (_decibels: number) => void): void => {
    this.subscribers = this.subscribers.filter((subscriber) => subscriber !== onDecibelUpdate)
    if (!this.subscribers.length) {
      this.stop()
    }
  }

  public start = (): void => {
    if (this.timeoutId) {
      return
    }
    this.timeoutId = window.setInterval(this.measureDecibels, this.decibelUpdateInterval)
  }

  public stop(): void {
    clearTimeout(this.timeoutId)
  }

  private measureDecibels = () : void => {
    this.analyser.getFloatTimeDomainData(this.dataArray)
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const x = this.dataArray[i]
      sum += x * x
    }
    const rms = Math.sqrt(sum / this.dataArray.length)
    const decibels = 20 * Math.log10(rms)

    this.subscribers.forEach((subscriber) => {
      subscriber(decibels)
    })
  }

  destroy(): void {
    this.stop()
    this.source.disconnect()
    this.audioContext.close()
    this.subscribers = []
  }
}

export default DecibelMonitor
