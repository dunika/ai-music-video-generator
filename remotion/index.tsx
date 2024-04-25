import {
  VideoConfig,
} from '@/types'
import {
  getAudioDurationInSeconds,
  getVideoMetadata,
} from '@remotion/media-utils'
import React from 'react'
import {
  Composition,
  registerRoot,
} from 'remotion'
import {
  COMP_NAME,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from '../constants'
import { staticFile } from '../modules/video'
import {
  getAudioFilePath,
  getVideoFilePath,
} from '../modules/videoFsPath'
import { VideoType } from '../types/enums'
import { Main } from './Video/Main'

export const RemotionRoot: React.FC<
  {
    durationInFrames: number
    config: VideoConfig
    hasVideo: boolean
    hasAudio: boolean
  }
> = ({
  durationInFrames,
  config,
  hasVideo,
  hasAudio,
}) => {
  return (
    <Composition
      id={COMP_NAME}
      component={Main}
      durationInFrames={durationInFrames}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{
        ...config,
        isRendering: true,
        hasVideo,
        hasAudio,
      }}

    />
  )
}

fetch(staticFile('video/config.json')).then(async (response) => {
  console.log('fetching config.json')
  const config: VideoConfig = await response.json()
  let durationInFrames = 0
  let hasVideo = false
  let hasAudio = false

  const [
    audioDurationInSeconds,
    videoMetadata,
  ] = await Promise.allSettled([
    getAudioDurationInSeconds(staticFile(getAudioFilePath(config.video.name))),
    getVideoMetadata(staticFile(getVideoFilePath(config.video.name))),
  ])

  hasVideo = videoMetadata.status === 'fulfilled'
  hasAudio = audioDurationInSeconds.status === 'fulfilled'

  if (audioDurationInSeconds.status === 'fulfilled') {
    durationInFrames = Math.floor(audioDurationInSeconds.value * VIDEO_FPS)
  } else if (videoMetadata.status === 'fulfilled') {
    durationInFrames = Math.floor(videoMetadata.value.durationInSeconds * VIDEO_FPS)
  } else {
    throw new Error('No audio or video found')
  }

  registerRoot(() => (
    <RemotionRoot
      durationInFrames={durationInFrames}
      config={config}
      hasVideo={hasVideo}
      hasAudio={hasAudio}
    />
  ))
})
