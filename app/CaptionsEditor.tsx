import useDebouncedEffect from '@/hooks/useDebouncedEffect'
import CurrentVideo from '@/state/CurrentVideo'
import type {
  Caption,
  Video,
} from '@/types'
import React, {
  useEffect,
  useRef,
  useState,
} from 'react'
import { VIDEO_FPS } from '../constants'

import styles from './styles'

type GetCaptionUpdates = ({
  captionIndex,
  captions,
}: {
  captionIndex: number,
  captions: Caption[],
}) => { [key: number]: Caption };

const getCaptionsWithImageCounts = (passedCaptions: Caption[]): Caption[] => {
  // Initialize captions with the images property set to 0
  const captions = passedCaptions.map((caption) => ({
    ...caption,
    images: 0,
  }))

  let timeOfLastImage = 0
  const imageFrequency = 2000

  for (let index = 0; index < captions.length; index++) {
    const caption = captions[index]
    const nextCaption = captions[index + 1]
    const captionEnd = nextCaption ? nextCaption.start : caption.end
    const durationIncludingNextStart = captionEnd - timeOfLastImage

    // Determine if the gap or the total duration warrants adding images
    if (durationIncludingNextStart > imageFrequency) {
      const imagesToAdd = Math.floor(durationIncludingNextStart / imageFrequency)
      caption.images = imagesToAdd
      // Advance the timeOfLastImage by the allotted image slots
      timeOfLastImage += imagesToAdd * imageFrequency
    } else if (index === 0) {
      // Special case for the first caption if it starts after a significant gap
      caption.images = 1
      timeOfLastImage = caption.start
    }
  }

  return captions
}

const getUpdatesForNextCaptions: GetCaptionUpdates = ({
  captionIndex,
  captions,
}) => {
  let currentStart = null

  const update: { [key: number]: Caption } = {}
  for (let index = captionIndex; index < captions.length; index++) {
    const currentCaption = captions[index]
    const nextCaption = captions[index + 1]

    currentCaption.start = currentStart ?? currentCaption.start

    update[index] = currentCaption

    if (!nextCaption) {
      break
    }

    const currentDuration = nextCaption.start - currentCaption.start

    if (currentDuration >= 200) {
      break
    } else {
      currentStart = currentCaption.start + 200
    }
  }
  return update
}

const getUpdatesForPreviousCaptions: GetCaptionUpdates = ({
  captionIndex,
  captions,
}) => {
  let currentStart = null
  const update: { [key: number]: Caption } = {}
  for (let index = captionIndex; index >= 0; index--) {
    const currentCaption = captions[index]
    const previousCaption = captions[index - 1]

    currentCaption.start = currentStart ?? currentCaption.start

    update[index] = currentCaption

    if (!previousCaption) {
      break
    }

    const previousDuration = currentCaption.start - previousCaption.start

    if (previousDuration >= 200) {
      break
    } else {
      currentStart = currentCaption.start - 200
    }

    if (currentStart < 0) {
      return {}
    }
  }
  return update
}

type CaptionUpdateProps = {
  seekTo: (timeInSeconds: number) => void,
  getCurrentFrame: () => number,
  isPlaying: boolean,
}

export const CaptionTimeEditor: React.FC<CaptionUpdateProps> = ({
  seekTo,
  getCurrentFrame,
  isPlaying,
}) => {
  const captionContainerRef = useRef(null)
  const [currentSubIndex, setCurrentSub] = useState(0)
  const {
    currentVideo: video,
    updateCurrentVideo,
  } = CurrentVideo.useContainer()

  useDebouncedEffect(() => {
    fetch('http://localhost:3000/api/videos/captions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
      cache: 'no-cache',
    })
  }, [video], 1000)

  const updateCurrentVideoCaptionsWithImageCounts = () => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const captionsWithImageCounts = getCaptionsWithImageCounts(currentVideo.captions)
      return {
        ...currentVideo,
        captions: captionsWithImageCounts,
      }
    })
  }

  const updateCaptionstart = (captionIndex: number, start: number) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const captions = currentVideo.captions.map((caption) => ({ ...caption }))

      captions[captionIndex].start = start

      const previousUpdate = getUpdatesForPreviousCaptions({
        captionIndex,
        captions,
      })

      const nextUpdate = getUpdatesForNextCaptions({
        captionIndex,
        captions,
      })

      const update = {
        ...previousUpdate,
        ...nextUpdate,
      }

      if (!Object.keys(update).length) {
        return currentVideo
      }

      const nextSong = JSON.parse(JSON.stringify(currentVideo))
      const newCaptions = [...nextSong.captions]

      for (const key of Object.keys(update)) {
        const index = Number(key)
        newCaptions[index] = update[index]
      }

      seekTo((captions[captionIndex].start / 1000) * VIDEO_FPS)

      return {
        ...nextSong,
        captions: newCaptions,
      }
    })
  }

  const updateCaptionText = (captionIndex: number, text: string) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const newCaptions = [...currentVideo.captions]
      newCaptions[captionIndex] = {
        ...newCaptions[captionIndex],
        text,
      }
      return {
        ...currentVideo,
        captions: newCaptions,
      }
    })
  }

  const mergeWithNextCaption = (captionIndex: number) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const newCaptions = [...currentVideo.captions]
      const currentCaption = newCaptions[captionIndex]
      const nextCaption = newCaptions[captionIndex + 1]

      if (!nextCaption) {
        return currentVideo
      }

      const mergedText = `${currentCaption.text} ${nextCaption.text}`

      if (mergedText.length >= 12) {
        return currentVideo
      }

      newCaptions[captionIndex] = {
        ...currentCaption,
        text: mergedText,
      }

      newCaptions.splice(captionIndex + 1, 1)

      return {
        ...currentVideo,
        captions: newCaptions,
      }
    })
  }

  const updateCaptionImages = (captionIndex: number, images: string) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const newCaptions = [...currentVideo.captions]
      newCaptions[captionIndex] = {
        ...newCaptions[captionIndex],
        images: Math.max(Number(images), 0),
      }
      return {
        ...currentVideo,
        captions: newCaptions,
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

        const currentCaption = video.captions.findIndex((caption: Caption) => {
          return (caption.start / 1000) * framesPerSecond >= currentFrame
        })

        if (currentCaption) {
          setCurrentSub(currentCaption)
        }
      },
      200,
    )
    return () => clearInterval(inter)
  }, [video, getCurrentFrame, isPlaying])

  const deleteCaption = (itemIndex: number) => {
    updateCurrentVideo((currentVideo: Video): Video => {
      const nextCaptions = [...currentVideo.captions]
      nextCaptions.splice(itemIndex, 1)
      return {
        ...currentVideo,
        captions: nextCaptions,
      }
    })
  }

  if (!video) {
    return null
  }

  return (
    <div className="flex flex-col w-[300px]">
      <div className="flex flex-row items-center flex-start mb-4">
        <button type="button" className={`${styles.button} `} onClick={updateCurrentVideoCaptionsWithImageCounts}>
          Set image
        </button>
      </div>
      <div
        ref={captionContainerRef}
        className="mb-4 px-2 py-2 overflow-y-auto h-[600px] border-2 border-gray-300 rounded-md bg-gray-100 w-[480px] pb-[500px]"
      >
        {video.captions.map((caption, index) => {
          return (
            <div
              key={caption.start}
              id={`caption-${index}`}
              className={`flex flex-col mb-4 ${index < currentSubIndex ? 'bg-red-200' : ''} `}
            >
              <div className="flex items-center mb-4">
                <button
                  type="button"
                  onClick={() => deleteCaption(index)}
                  className="mr-1 text-2xl"
                >
                  ❌
                </button>
                <button
                  type="button"
                  className="mr-1 text-2xl"
                  onClick={() => mergeWithNextCaption(index)}
                >
                  ⬇️
                </button>
                <input
                  className={`w-[55px] ml-1 ${styles.input} mr-1`}
                  type="number"
                  value={caption.images || 0}
                  onChange={(e) => {
                    updateCaptionImages(index, e.target.value)
                  }}
                />

                <input
                  className={`w-[200px] ml-1 ${styles.input}`}
                  value={caption.text}
                  onChange={(e) => {
                    updateCaptionText(index, e.target.value)
                  }}
                />
                <button
                  type="button"
                  className=" mx-2 cursor-pointer text-2xl"
                  onClick={() => {
                    seekTo(Math.max((caption.start / 1000), 0) * VIDEO_FPS)
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
                  value={caption.start}
                  onChange={(e) => {
                    updateCaptionstart(index, Number(e.target.value))
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
