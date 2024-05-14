import {
  useEffect,
  useRef,
  useState,
} from 'react'
import useEvent from 'react-use-event-hook'
import WaveSurfer from 'wavesurfer.js'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'

const createOffscreenContainer = () => {
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.top = '-10000px'
  container.style.left = '-10000px'
  document.body.appendChild(container)
  return container
}

type UseAudioRecorderOptions = {
  waveColor: string,
  progressColor: string,
  scrollingWaveform: boolean,
  renderRecordedAudio: boolean,
  onProgress: (_duration: number) => void,
}

type Status = {
  isRecording: boolean,
  isPaused: boolean,
  isActive: boolean,
  isFinished: boolean,
}

type AudioWaveformRecorder = {
  startMic: () => Promise<MediaStream | null>;
  stopRecording: () => void;
  startRecording: () => void;
  togglePauseRecording: () => void;
  status: Status;
  recordingBlob: Blob | null;
};

const useAudioWaveformRecorder = (
  container: HTMLElement | null,
  options: UseAudioRecorderOptions | null = null,
): AudioWaveformRecorder => {
  const {
    waveColor = 'rgb(200, 0, 200)',
    progressColor = 'rgb(100, 0, 100)',
    scrollingWaveform,
    renderRecordedAudio,
    onProgress,
  } = options ?? {}

  const wavesurfer = useRef<WaveSurfer | null>(null)
  const record = useRef<RecordPlugin | null>(null)
  const offScreenContainer = useRef<HTMLElement | null>(null)

  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [status, setStatus] = useState<Status>({
    isRecording: false,
    isPaused: false,
    isActive: false,
    isFinished: false,
  })

  useEffect(() => {
    let wavesurferContainer = container ?? offScreenContainer.current
    if (!wavesurferContainer) {
      offScreenContainer.current = createOffscreenContainer()
      wavesurferContainer = offScreenContainer.current
    }

    wavesurfer.current = WaveSurfer.create({
      container: wavesurferContainer,
      waveColor,
      progressColor,
    })

    record.current = wavesurfer.current.registerPlugin(RecordPlugin.create({
      scrollingWaveform,
      renderRecordedAudio,
    }))

    const getStatus = (nextStatus: Partial<Status> = {}) => {
      setStatus({
        isRecording: record.current?.isRecording() ?? false,
        isPaused: record.current?.isPaused() ?? false,
        isActive: record.current?.isActive() ?? false,
        isFinished: nextStatus.isFinished ?? false,
      })
    }

    record.current.on('record-start', () => {
      getStatus()
      setRecordingBlob(null)
    })
    record.current.on('record-pause', (blob) => {
      getStatus()
      setRecordingBlob(blob)
    })
    record.current.on('record-resume', getStatus)
    record.current.on('record-end', (blob) => {
      getStatus({ isFinished: true })
      setRecordingBlob(blob)
    })

    if (onProgress) {
      record.current.on('record-progress', onProgress)
    }

    return wavesurfer.current?.destroy
  }, [
    container,
    scrollingWaveform,
    renderRecordedAudio,
    waveColor,
    progressColor,
    onProgress,
  ])

  const startMic = useEvent(async (deviceId?: string): Promise<MediaStream | null> => {
    const stream = await record.current?.startMic({ deviceId })
    return stream ?? null
  })

  const startRecording = useEvent((deviceId?: string) => {
    return record.current?.startRecording({ deviceId })
  })

  const stopRecording = useEvent(() => {
    record.current?.stopRecording()
  })

  const togglePauseRecording = useEvent(() => {
    if (record.current?.isPaused()) {
      record.current?.resumeRecording()
    } else {
      record.current?.pauseRecording()
    }
  })

  return {
    startMic,
    startRecording,
    stopRecording,
    togglePauseRecording,
    status,
    recordingBlob,
  }
}

export default useAudioWaveformRecorder
