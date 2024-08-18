import {
  getAudioFilePath,
  getVideoFilePath,
} from '@/modules/videoFsPath'
import {
  VIDEO_FPS,
} from '@/constants'
import { getMediaDuration } from '@/modules/ffmpeg'

export async function GET(request: Request) {
  // get from query
  // http://localhost:3000/api/video?songName=public&segmentName=videos&videoType=storybook
  const { searchParams } = new URL(request.url)
  const {
    videoName,
  } = Object.fromEntries(searchParams.entries())
  const audioFilePath = getAudioFilePath(videoName)
  const videoFilePath = getVideoFilePath(videoName)

  const [
    audioDurationResult,
    videoDurationResult,
  ] = await Promise.allSettled([
    getMediaDuration(audioFilePath),
    getMediaDuration(videoFilePath),
  ])


  const hasAudioDuration = audioDurationResult.status === 'fulfilled'
  const hasVideoDuration = videoDurationResult.status === 'fulfilled'

  if (!hasAudioDuration && !hasVideoDuration) {
    return Response.json({
      error: audioDurationResult.reason || videoDurationResult.reason,
    }, {
      status: 500,
    })
  }

  if (hasAudioDuration) {
    return Response.json(getDurationInFrames(audioDurationResult.value))
  }

  if (hasVideoDuration) {
    return Response.json(getDurationInFrames(videoDurationResult.value))
  }
}


const getDurationInFrames = async (mediaDuration: number) => {
  return Math.floor(mediaDuration * VIDEO_FPS)
}
