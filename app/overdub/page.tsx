import { set } from 'lodash'
import { NextPage } from 'next/types'
import React, {
  useEffect,
  useReducer,
  useState,
} from 'react'
import { useAudioPlayer } from 'react-use-audio-player'
import { useAudioRecorder } from 'react-use-audio-recorder'
import useEvent from 'react-use-event-hook'
import * as Tone from 'tone'

// TODO: decibel meter

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

const useDecibelMeter = () => {
  const [decibels, setDecibels] = useState<number>(0)

  useEffect(() => {
    const meter = new Tone.Meter()
    const mic = new Tone.UserMedia()
    mic.open()
    mic.connect(meter)

    const timer = setInterval(() => {
      let value = meter.getValue()
      value = Array.isArray(value) ? value : [value]
      value = value.reduce((acc, val) => Math.max(acc, val), 0)
      setDecibels(value)
    }, 100)

    return () => {
      clearInterval(timer)
      mic.close()
    }
  }, [])

  return decibels
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
  } = useAudioPlayer()

  const {
    startRecording,
    stopRecording,
    togglePauseResume: togglePlayPauseRecording,
    recordingBlob,
  } = useAudioRecorder()

  const [status, dispatchStatusAction] = useRecordingStatus()

  useEffect(() => {
    dispatchStatusAction({ type: actions.initialize })
    stopAudio()
    stopRecording()
    loadAudio(audioFile, {
      autoplay: false,
    })
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

const Overdub: NextPage = () => {
  const [file, setFile] = useState(null)

  if (!file) {
    return (
      <div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} placeholder="Upload your audio file" />
      </div>
    )
  }

  return null
}
