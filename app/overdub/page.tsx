'use client'

import { NextPage } from 'next/types'
import React, {
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useAudioRecorder as useAudioRecorderold } from 'react-audio-voice-recorder'
import { useAudioPlayer } from 'react-use-audio-player'
import useEvent from 'react-use-event-hook'
import useAudioRecorder from './useAudioRecorder'

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')

  a.href = url
  a.download = filename || 'download'

  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

const actions = {
  start: 'start',
  stop: 'stop',
  togglePause: 'togglePause',
  initialize: 'initialize',
}

const initialState = {
  recording: false,
  paused: false,
  finished: false,
}

const useRecordingStatus = () => {
  return useReducer((state, action) => {
    switch (action.type) {
      case actions.start:
        return {
          recording: true,
          paused: false,
          finished: false,
        }
      case actions.stop:
        return {
          recording: false,
          paused: false,
          finished: true,
        }
      case actions.togglePause:
        return {
          ...state,
          paused: !state.paused,
        }
      case actions.initialize:
        return initialState
      default:
        return state
    }
  }, initialState)
}

const useOverdub = ({
  audioFile,
  onFinishedRecording,
}) => {
  const {
    load: loadAudio,
    play: playAudio,
    stop: stopAudio,
    togglePlayPause: togglePlayPauseAudio,
    cleanup: cleanupAudio,
  } = useAudioPlayer()

  const {
    startRecording,
    stopRecording,
    togglePauseResume: togglePlayPauseRecording,
    recordingBlob,
  } = useAudioRecorderold()

  const [status, dispatchStatusAction] = useRecordingStatus()

  useEffect(() => {
    dispatchStatusAction({ type: actions.initialize })
    if (audioFile) {
      loadAudio(audioFile, {
        autoplay: false,
      })
    }
    cleanupAudio()
    stopRecording()
  }, [audioFile, loadAudio])

  const { finished } = status
  useEffect(() => {
    if (recordingBlob && finished) {
      onFinishedRecording(recordingBlob)
    }
  }, [recordingBlob, onFinishedRecording, finished])

  const start = useEvent(() => {
    dispatchStatusAction({ type: actions.start })
    playAudio()
    startRecording()
  })

  const stop = useEvent(() => {
    dispatchStatusAction({ type: actions.stop })
    stopAudio()
    stopRecording()
  })

  const pause = useEvent(() => {
    dispatchStatusAction({ type: actions.togglePause })
    togglePlayPauseAudio()
    togglePlayPauseRecording()
  })

  return {
    status,
    start,
    stop,
    pause,
  }
}

// const useDecibelMeter = () => {
//   const [decibels, setDecibels] = useState<number>(0)

//   window.lad = lad

//   useEffect(() => {
//     debugger
//     const meter = new MeterGet()
//     const mic = new UserMedia()
//     mic.open()
//     mic.connect(meter)

//     const timer = setInterval(() => {
//       let value = meter.getValue()
//       value = Array.isArray(value) ? value : [value]
//       value = value.reduce((acc, val) => Math.max(acc, val), 0)
//       setDecibels(value)
//     }, 100)

//     return () => {
//       clearInterval(timer)
//       mic.close()
//     }
//   }, [])

//   return decibels
// }

const Overdub: NextPage = () => {
  const [file, setFile] = useState(null)

  const {
    status,
    start,
    stop,
    pause,
  } = useOverdub({
    audioFile: file,
    onFinishedRecording: (blob) => {
      console.log(blob)
      //  download
      downloadBlob(blob, 'recording.wav')
    },
  })

  const container = useRef(null)

  const lad = useAudioRecorder(container.current)

  window.lad = lad

  // const decibels = useMicrophoneDecibels()

  if (!file) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} placeholder="Upload your audio file" />
      </div>
    )
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={pause}>{status.paused ? 'Resume' : 'Pause'}</button>
      {/* <div>{decibels}</div> */}
      <div ref={container} />
    </div>
  )
}

export default Overdub
