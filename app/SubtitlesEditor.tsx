import useDebouncedEffect from '@/hooks/useDebouncedEffect'
import CurrentVideo from '@/state/CurrentVideo'
import type {
  Subtitle,
  Video,
} from '@/types'
import React, {
  useEffect,
  useRef,
  useState,
} from 'react'
import { VIDEO_FPS } from '../constants'

import styles from './styles'

type GetSubtitleUpdates = ({
  subtitleIndex,
  subtitles,
}: {
  subtitleIndex: number,
  subtitles: Subtitle[],
}) => { [key: number]: Subtitle };

const getSubtitlesWithImageCounts = (passedSubtitles: Subtitle[]): Subtitle[] => {
  // Initialize subtitles with the images property set to 0
  const subtitles = passedSubtitles.map((subtitle) => ({
    ...subtitle,
    images: 0,
  }))

  let timeOfLastImage = 0
  const imageFrequency = 2000

  for (let index = 0; index < subtitles.length; index++) {
    const subtitle = subtitles[index]
    const nextSubtitle = subtitles[index + 1]
    const subtitleEnd = nextSubtitle ? nextSubtitle.start : subtitle.end
    const durationIncludingNextStart = subtitleEnd - timeOfLastImage

    // Determine if the gap or the total duration warrants adding images
    if (durationIncludingNextStart > imageFrequency) {
      const imagesToAdd = Math.floor(durationIncludingNextStart / imageFrequency)
      subtitle.images = imagesToAdd
      // Advance the timeOfLastImage by the allotted image slots
      timeOfLastImage += imagesToAdd * imageFrequency
    } else if (index === 0) {
      // Special case for the first subtitle if it starts after a significant gap
      subtitle.images = 1
      timeOfLastImage = subtitle.start
    }
  }

  return subtitles
}

const getUpdatesForNextSubtitles: GetSubtitleUpdates = ({
  subtitleIndex,
  subtitles,
}) => {
  let currentStart = null

  const update: { [key: number]: Subtitle } = {}
  for (let index = subtitleIndex; index < subtitles.length; index++) {
    const currentSubtitle = subtitles[index]
    const nextSubtitle = subtitles[index + 1]

    currentSubtitle.start = currentStart ?? currentSubtitle.start

    update[index] = currentSubtitle

    if (!nextSubtitle) {
      break
    }

    const currentDuration = nextSubtitle.start - currentSubtitle.start

    if (currentDuration >= 200) {
      break
    } else {
      currentStart = currentSubtitle.start + 200
    }
  }
  return update
}

const getUpdatesForPreviousSubtitles: GetSubtitleUpdates = ({
  subtitleIndex,
  subtitles,
}) => {
  let currentStart = null
  const update: { [key: number]: Subtitle } = {}
  for (let index = subtitleIndex; index >= 0; index--) {
    const currentSubtitle = subtitles[index]
    const previousSubtitle = subtitles[index - 1]

    currentSubtitle.start = currentStart ?? currentSubtitle.start

    update[index] = currentSubtitle

    if (!previousSubtitle) {
      break
    }

    const previousDuration = currentSubtitle.start - previousSubtitle.start

    if (previousDuration >= 200) {
      break
    } else {
      currentStart = currentSubtitle.start - 200
    }

    if (currentStart < 0) {
      return {}
    }
  }
  return update
}

type SubtitleUpdateProps = {
  seekTo: (timeInSeconds: number) => void,
  getCurrentFrame: () => number,
  isPlaying: boolean,
}

export const SubtitleTimeEditor: React.FC<SubtitleUpdateProps> = ({
  seekTo,
  getCurrentFrame,
  isPlaying,
}) => {
  const subtitleContainerRef = useRef(null)
  const [currentSubIndex, setCurrentSub] = useState(0)
  const {
    currentVideo: video,
    updateCurrentVideo,
  } = CurrentVideo.useContainer()

  useDebouncedEffect(() => {
    fetch('http://localhost:3000/api/videos/subtitles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
      cache: 'no-cache',
    })
  }, [video], 1000)

  const updateCurrentVideoSubtitlesWithImageCounts = () => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const subtitlesWithImageCounts = getSubtitlesWithImageCounts(currentVideo.subtitles)
      return {
        ...currentVideo,
        subtitles: subtitlesWithImageCounts,
      }
    })
  }

  const updateSubtitleStart = (subtitleIndex: number, start: number) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const subtitles = currentVideo.subtitles.map((subtitle) => ({ ...subtitle }))

      subtitles[subtitleIndex].start = start

      const previousUpdate = getUpdatesForPreviousSubtitles({
        subtitleIndex,
        subtitles,
      })

      const nextUpdate = getUpdatesForNextSubtitles({
        subtitleIndex,
        subtitles,
      })

      const update = {
        ...previousUpdate,
        ...nextUpdate,
      }

      if (!Object.keys(update).length) {
        return currentVideo
      }

      const nextSong = JSON.parse(JSON.stringify(currentVideo))
      const newSubtitles = [...nextSong.subtitles]

      for (const key of Object.keys(update)) {
        const index = Number(key)
        newSubtitles[index] = update[index]
      }

      seekTo((subtitles[subtitleIndex].start / 1000) * VIDEO_FPS)

      return {
        ...nextSong,
        subtitles: newSubtitles,
      }
    })
  }

  const updateSubtitleText = (subtitleIndex: number, text: string) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const newSubtitles = [...currentVideo.subtitles]
      newSubtitles[subtitleIndex] = {
        ...newSubtitles[subtitleIndex],
        text,
      }
      return {
        ...currentVideo,
        subtitles: newSubtitles,
      }
    })
  }

  const mergeWithNextSubtitle = (subtitleIndex: number) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const newSubtitles = [...currentVideo.subtitles]
      const currentSubtitle = newSubtitles[subtitleIndex]
      const nextSubtitle = newSubtitles[subtitleIndex + 1]

      if (!nextSubtitle) {
        return currentVideo
      }

      const mergedText = `${currentSubtitle.text} ${nextSubtitle.text}`

      if (mergedText.length >= 12) {
        return currentVideo
      }

      newSubtitles[subtitleIndex] = {
        ...currentSubtitle,
        text: mergedText,
      }

      newSubtitles.splice(subtitleIndex + 1, 1)

      return {
        ...currentVideo,
        subtitles: newSubtitles,
      }
    })
  }

  const updateSubtitleImages = (subtitleIndex: number, images: string) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const newSubtitles = [...currentVideo.subtitles]
      newSubtitles[subtitleIndex] = {
        ...newSubtitles[subtitleIndex],
        images: Math.max(Number(images), 0),
      }
      return {
        ...currentVideo,
        subtitles: newSubtitles,
      }
    })
  }

  useEffect(() => {
    const inter = setInterval(
      () => {
        const framesPerSecond = 30
        const currentFrame = getCurrentFrame()
        if (!currentFrame) {
          return
        }

        const currentSubtitle = video.subtitles.findIndex((subtitle: Subtitle) => {
          return (subtitle.start / 1000) * framesPerSecond >= currentFrame
        })

        if (currentSubtitle) {
          setCurrentSub(currentSubtitle)
        }
      },
      200,
    )
    return () => clearInterval(inter)
  }, [video, getCurrentFrame, isPlaying])

  const deleteSubtitle = (itemIndex: number) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const nextSubtitles = [...currentVideo.subtitles]
      nextSubtitles.splice(itemIndex, 1)
      return {
        ...currentVideo,
        subtitles: nextSubtitles,
      }
    })
  }

  if (!video) {
    return null
  }

  return (
    <div className="flex flex-col w-[300px]">
      <div className="flex flex-row items-center flex-start mb-4">
        <button type="button" className={`${styles.button} `} onClick={updateCurrentVideoSubtitlesWithImageCounts}>
          Set image
        </button>
      </div>
      <div
        ref={subtitleContainerRef}
        className="mb-4 px-2 py-2 overflow-y-auto h-[600px] border-2 border-gray-300 rounded-md bg-gray-100 w-[480px] pb-[500px]"
      >
        {video.subtitles.map((subtitle, index) => {
          return (
            <div
              key={subtitle.start}
              id={`subtitle-${index}`}
              className={`flex flex-col mb-4 ${index < currentSubIndex ? 'bg-red-200' : ''} `}
            >
              <div className="flex items-center mb-4">
                <button
                  type="button"
                  onClick={() => deleteSubtitle(index)}
                  className="mr-1 text-2xl"
                >
                  ❌
                </button>
                <button
                  type="button"
                  className="mr-1 text-2xl"
                  onClick={() => mergeWithNextSubtitle(index)}
                >
                  ⬇️
                </button>
                <input
                  className={`w-[55px] ml-1 ${styles.input} mr-1`}
                  type="number"
                  value={subtitle.images || 0}
                  onChange={(e) => {
                    updateSubtitleImages(index, e.target.value)
                  }}
                />

                <input
                  className={`w-[200px] ml-1 ${styles.input}`}
                  value={subtitle.text}
                  onChange={(e) => {
                    updateSubtitleText(index, e.target.value)
                  }}
                />
                <button
                  type="button"
                  className=" mx-2 cursor-pointer text-2xl"
                  onClick={() => {
                    seekTo(Math.max((subtitle.start / 1000), 0) * VIDEO_FPS)
                  }}
                >
                  ▶️
                </button>
                <input
                  step="100"
                  className={`w-[70px] ml-1 ${styles.input}`}
                  style={{
                    marginRight: '10px',
                  }}
                  type="number"
                  value={subtitle.start}
                  onChange={(e) => {
                    updateSubtitleStart(index, Number(e.target.value))
                  }}
                />

              </div>
              <div className="flex flex-row items-center flex-start" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
