import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import WaveSurfer from 'wavesurfer.js'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'

class AudioMonitor {
  constructor(stream, options = {}) {
    this.audioContext = new AudioContext()
    this.source = this.audioContext.createMediaStreamSource(stream)
    this.analyser = this.audioContext.createAnalyser()
    this.dataArray = new Float32Array(this.analyser.fftSize) // Array to hold data
    this.decibelUpdateInterval = options.decibelUpdateInterval || 100 // Interval in ms to update decibels

    // Configure the analyser
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10

    // Connect everything
    this.source.connect(this.analyser)

    // Bind methods
    this.measureDecibels = this.measureDecibels.bind(this)
    this.handleDecibelUpdate = options.onDecibelUpdate || function () {}

    // Start measuring
    this.startMeasuring()
  }

  measureDecibels() {
    this.analyser.getFloatTimeDomainData(this.dataArray)
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const x = this.dataArray[i]
      sum += x * x
    }
    const rms = Math.sqrt(sum / this.dataArray.length)
    const decibels = 20 * Math.log10(rms)

    // Invoke the callback with the computed decibels
    this.handleDecibelUpdate(decibels)

    // Continue measuring
    this.timeoutId = setTimeout(this.measureDecibels, this.decibelUpdateInterval)
  }

  startMeasuring() {
    this.timeoutId = setTimeout(this.measureDecibels, this.decibelUpdateInterval)
  }

  stopMeasuring() {
    clearTimeout(this.timeoutId)
  }

  destroy() {
    this.stopMeasuring()
    this.source.disconnect()
    this.audioContext.close()
  }
}

const useAudioRecorder = (container) => {
  const [wavesurfer, setWavesurfer] = useState(null)
  const [record, setRecord] = useState(null)
  const [devices, setDevices] = useState([])
  const [scrollingWaveform, setScrollingWaveform] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState('')

  // Initialize WaveSurfer and RecordPlugin
  useEffect(() => {
    if (!container) {
      return
    }
    const ws = WaveSurfer.create({
      container,
      waveColor: 'rgb(200, 0, 200)',
      progressColor: 'rgb(100, 0, 100)',
    })

    const rec = ws.registerPlugin(RecordPlugin.create({
      scrollingWaveform,
      renderRecordedAudio: false,
    }))

    setWavesurfer(ws)
    setRecord(rec)

    // Cleanup on component unmount
    return () => {
      ws.destroy()
    }
  }, [scrollingWaveform, container])

  // Handle recording end
  useEffect(() => {
    if (record) {
      record.on('record-end', (blob) => {
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
      })
    }
  }, [record])

  // Fetch available audio devices
  useEffect(() => {
    const fetchDevices = async () => {
      const devices = await RecordPlugin.getAvailableAudioDevices()
      setDevices(devices)
    }

    fetchDevices()
  }, [])

  // Start recording
  const startRecording = useCallback((deviceId) => {
    if (record) {
      record.startRecording({ deviceId })
    }
  }, [record])

  // Start recording
  const startMic = useCallback((deviceId) => {
    if (record) {
      record.startMic({ deviceId }).then((stream) => {
      // TODO set up properly
        const audioMonitor = new AudioMonitor(stream, {
          onDecibelUpdate: (decibels) => console.log(`Current decibels: ${decibels}`),
          decibelUpdateInterval: 100, // Update every 500ms
        })
      })
    }
  }, [record])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (record) {
      record.stopRecording()
    }
  }, [record])

  // Toggle recording
  const togglePauseRecording = useCallback(() => {
    if (record) {
      if (record.isPaused()) {
        record.resumeRecording()
      } else {
        record.pauseRecording()
      }
    }
  }, [record])

  // Change scrolling waveform
  const toggleScrolling = useCallback((isChecked) => {
    setScrollingWaveform(isChecked)
  }, [])

  return {
    wavesurfer,
    record,
    devices,
    recordingUrl,
    startRecording,
    stopRecording,
    togglePauseRecording,
    toggleScrolling,
    startMic,
  }
}

export default useAudioRecorder
