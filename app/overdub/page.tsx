'use client'

import { NextPage } from 'next/types'
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAudioPlaybackRecorder, useAudioRecorder, useDecibelMonitor, useMediaDevices } from '@dunika/media-recorder-hooks'
import ky from 'ky-universal'
import styles from '../styles'


const upload = async (fileToTranscribe: File, videoName: string, file: File) => {
  const formData = new FormData()
debugger
  formData.append('fileToTranscribe', fileToTranscribe)
  formData.append('videoName', videoName)
  formData.append('file', file)
  
  try {
    await ky('/api/videos/captions/transcribe', {
      method: 'POST',
      body: formData,
    })
    // go to /
    window.location.href = '/'
  } catch (e) {
    alert(e)
  }

}

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

const AudioDeviceSelector: React.FC<{
  devices: MediaDeviceInfo[],
  selectedDeviceId: string,
  onDeviceChange: (_deviceId: string) => void,
}> = ({
  devices,
  selectedDeviceId,
  onDeviceChange,
}) => {
  return (
    <select onChange={(e) => onDeviceChange(e.target.value)} className="text-black" value={selectedDeviceId}>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
      ))}
    </select>
  )
}

const Overdub: NextPage = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current?.play();
    }
  }, []);

  const [file, setFile] = useState<File | null>(null)
  const [videoName, setVideoName] = useState<string>('')

  const [audioDeviceId, setAudioDeviceId] = useState<string>('default')
  const [audioInputDeviceId, setAudioInputDeviceId] = useState<string>('default')

  const { devices } = useMediaDevices()

  const audioSrcAndFormat = useMemo(() => {
    if (!file) {
      return {
        playbackSrc: null,
        playbackFormat: null,
      }
    }

    const playbackSrc = URL.createObjectURL(file)

    return {
      playbackSrc,
      playbackFormat: file.type.split('/')[1],
    }
  }, [file])

  useEffect(() => {
    if (file) {
      setVideoName(file.name.split('.')[0])
      const videoURL = URL.createObjectURL(file)
      setVideoSrc(videoURL)
    }
  }, [file])

  const {
    controls,
    error,
    state,
    stream,
  } = useAudioRecorder({
    ...audioSrcAndFormat,
    deviceId: audioDeviceId,
    // outputDeviceId: audioInputDeviceId,
    // recordingFormat: 'audio/webm;codecs=opus',
    onFinished: (blob) => {
      if (!blob) {
        return alert('No blob')
      }
      if (!file) {
        return alert('No file')
      }

      const uploadFile = new File([blob], `${file?.name ?? 'file'}.webm`)

      upload(uploadFile, videoName, file)

      downloadBlob(blob, 'overdub.webm')
    },
  })

  const d = useDecibelMonitor({ stream })

  useEffect(() => {
    if (error) {
      console.error(error)
      alert(error)
    }
  }, [error])

  if (!file) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <input
          type="file"
          onChange={({ target }) => {
            const file = target.files?.[0]
            if (file) {
              setFile(file)
            }
          }}
          placeholder="Add file to transcribe"
        />
      </div>
    )
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <h3>Decibels</h3>
      <div>{d}</div>
      <h3>Audio Input</h3>
      <AudioDeviceSelector
        devices={devices.audioinput}
        selectedDeviceId={audioDeviceId}
        onDeviceChange={setAudioDeviceId}
      />
      <br />
      <h3>Audio Output</h3>
      <AudioDeviceSelector
        devices={devices.audiooutput}
        selectedDeviceId={audioInputDeviceId}
        onDeviceChange={setAudioInputDeviceId}
      />
      <br />
      <h3>File Name</h3>
      <input type="text" onChange={(e) => setVideoName(e.target.value)} value={videoName} className={styles.input}/>
      <br />
      <button onClick={() => {
        controls.start()
        if (videoRef.current) {
          videoRef.current?.play();
        }
      }}>Start</button>
      <br />
      <button onClick={controls.stop}>Stop</button>
      <br />
      <button onClick={state === 'paused' ? controls.resume : controls.pause}>{state === 'paused' ? 'Resume' : 'Pause'}</button>
      <br />
      <br />
      {videoSrc && (
     <video controls width="320" height="240" ref={videoRef}>
     <source src={videoSrc} type="video/mp4" />
   </video>
      )}
      <div className="">
        <input
          type="file"
          onChange={(e) => {
            debugger
            const fileToTranscribe = e.target.files?.[0]
            if (!fileToTranscribe) {
              return
            }
            return upload(fileToTranscribe, videoName, file)
          }}
          placeholder="Manually add audio transcription"
        />
      </div>
    </div>
  )
}

export default Overdub
