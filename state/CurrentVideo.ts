import { createContainer } from 'unstated-next'
import {
  useEffect,
  useState,
} from 'react'
import type { Video } from '../types'
import Videos from './Videos'

type UpdateVideo = (video: Video) => Video;

const emptyVideo: Video = {
  subtitles: [],
  name: '',
}

const useCurrentVideo = () => {
  const [videos, setVideos] = Videos.useContainer()
  const [currentVideoId, setCurrentVideoId] = useState<string|null>(() => {
    if (videos.length) {
      return videos[0].name
    }
    return null
  })

  useEffect(() => {
    if (videos.length && !currentVideoId) {
      setCurrentVideoId(videos[0].name)
    }
  }, [videos, currentVideoId])

  const currentVideoIndex = videos.findIndex((video) => video.name === currentVideoId)!

  const updateCurrentVideo = (updater: UpdateVideo) => {
    setVideos((currentVideos: Video[]) => {
      const currentVideo = currentVideos[currentVideoIndex]
      const update = updater(currentVideo)
      const newVideos = [...currentVideos]
      newVideos[currentVideoIndex] = {
        ...currentVideo ?? {},
        ...update,
      }
      return newVideos
    })
  }

  const currentVideo = videos[currentVideoIndex]

  if (!currentVideo) {
    return {
      currentVideo: emptyVideo,
      currentVideoId: null,
      setCurrentVideoId,
      updateCurrentVideo,
    }
  }

  return {
    currentVideo,
    currentVideoId,
    setCurrentVideoId,
    updateCurrentVideo,
  }
}

const CurrentVideo = createContainer(useCurrentVideo)

export default CurrentVideo
