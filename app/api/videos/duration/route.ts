import ffmpeg from 'fluent-ffmpeg'

import {
  getAudioFilePath,
  getVideoFilePath,
} from '@/modules/videoFsPath'
import {
  VIDEO_FPS,
} from '@/constants'
import { VideoType } from '../../../../types/enums'

function getMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve(0)
        return
      }
      const { duration } = metadata.format
      resolve(duration)
    })
  })
}

export async function GET(request: Request) {
  // get from query
  // http://localhost:3000/api/video?songName=public&segmentName=songs&videoType=storybook
  const { searchParams } = new URL(request.url)
  const {
    videoName,
    videoType,
  } = Object.fromEntries(searchParams.entries())
  const audioFilePath = getAudioFilePath(videoName)
  const videoFilePath = getVideoFilePath(videoName)

  let durationInFrames = 0
  let hasVideo = false
  let hasAudio = false

  const [
    audioDurationInSeconds,
    videoMetadata,
  ] = await Promise.allSettled([
    getMediaDuration(audioFilePath),
    getMediaDuration(videoFilePath),
  ])

  hasVideo = videoMetadata.status === 'fulfilled'
  hasAudio = audioDurationInSeconds.status === 'fulfilled'

  if (audioDurationInSeconds.status === 'fulfilled') {
    durationInFrames = Math.floor(audioDurationInSeconds.value * VIDEO_FPS)
  } else if (videoMetadata.status === 'fulfilled') {
    durationInFrames = Math.floor(videoMetadata.value * VIDEO_FPS)
  } else {
    throw new Error('No audio or video found')
  }

  return Response.json(durationInFrames)
}
