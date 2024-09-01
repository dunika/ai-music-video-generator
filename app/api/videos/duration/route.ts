import {
  getAudioFilePath,
  getVideoFilePath,
} from '@/modules/videoFsPath'
import {
  VIDEO_FPS,
} from '@/constants'
import { getMediaDuration } from '@/modules/ffmpeg'
import { findMediaFilePath } from '@/modules/videoFs'

export async function GET(request: Request) {
  // get from query
  // http://localhost:3000/api/video?songName=public&segmentName=videos&videoType=storybook
  const { searchParams } = new URL(request.url)
  const {
    videoName,
  } = Object.fromEntries(searchParams.entries())
  const audioFilePath = await findMediaFilePath(videoName, 'audio')
  const videoFilePath = await findMediaFilePath(videoName, 'video')

  const [
    audioDurationResult,
    videoDurationResult,
  ] = await Promise.allSettled([
    getMediaDuration(videoFilePath),
    getMediaDuration(audioFilePath),
  ])

  const hasError = [videoDurationResult, audioDurationResult]
    .every((result) => result.status === 'rejected')

  if (hasError) {
    return Response.json({
      error: 'Error getting duration',
    }, {
      status: 500,
    })
  }

  const result = [videoDurationResult, audioDurationResult]
    .find((result) => result.status === 'fulfilled')

  if (!result) {
    return Response.json({
      error: 'No duration found',
    }, {
      status: 500,
    })
  }

    return Response.json({
      data: {
        durationInFrames: getDurationInFrames(result.value),
      },
    })

  
}


const getDurationInFrames = (mediaDuration: number) => {
  return Math.floor(mediaDuration * VIDEO_FPS)
}
