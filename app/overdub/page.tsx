'use client'

import { NextPage } from 'next/types'
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'
import useAudioPlaybackRecorder from './media-recorder-hooks/src/useAudioPlaybackRecorder'
import useMediaDevices from './media-recorder-hooks/src/useMediaDevices'

const upload = async (file: File) => {
  const formData = new FormData()

  formData.append('file', file)

  await fetch('/api/videos/subtitles/transcribe', {
    method: 'POST',
    body: formData,
  })
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

const AudioDeviceSelector: React.FC = ({
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
  const [file, setFile] = useState<File | null>(null)

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
    console.log({ devices })
  })

  const {
    controls,
    blob,
    error,
    state,
  } = useAudioPlaybackRecorder({
    ...audioSrcAndFormat,
    inputDeviceId: audioDeviceId,
    outputDeviceId: audioInputDeviceId,
    // recordingFormat: 'audio/webm;codecs=opus',
    onFinished: (blob) => {
      const uploadFile = new File([blob], `${file?.name ?? 'file'}.webm`)

      upload(uploadFile)
      // downloadBlob(blob, `overdub.${AudioMediaExtension.Mp3}`)

      downloadBlob(blob, 'overdub.webm')
    },
  })

  const download = () => {
    downloadBlob(new Blob(blob, { type: 'audio/webm;codecs=opus' }), 'overdub.webm')
  }

  useEffect(() => {
    if (error) {
      console.error(error)
      alert(error)
    }
  }, [error])

  if (!file) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} placeholder="Upload your audio file" />
      </div>
    )
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
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
      <button onClick={controls.start}>Start</button>
      <br />
      <button onClick={controls.stop}>Stop</button>
      <br />
      <button onClick={state === 'paused' ? controls.resume : controls.pause}>{state === 'paused' ? 'Resume' : 'Pause'}</button>
      <br />
      <button onClick={download}>Download</button>
      <br />
      <div className="">
        <input
          type="file"
          onChange={(e) => {
            return upload(e.target.files[0])
          }}
          placeholder="Upload your audio file"
        />
      </div>
    </div>
  )
}

export default Overdub

// stream = window.streamReference
// audioChunks = [];

// mediaRecorder.ondataavailable = event => {
//     if (event.data.size > 0) {
//         audioChunks.push(event.data);
//     }
// };

// mediaRecorder.onstop = () => {
//     debugger
//     const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
//     const audioUrl = URL.createObjectURL(audioBlob);

//     // Optionally, you can save the audio blob to a file
//     const a = document.createElement('a');
//     a.style.display = 'none';
//     a.href = audioUrl;
//     a.download = 'audio_recording.wav';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
// };

// mediaRecorder.start();
