'use client'

import { CaptionTimeEditor } from '@/app/CaptionsEditor'
import { toTitleCase } from '@/modules/strings'
import { staticFile } from '@/modules/video'
import { getStorybookImagePath } from '@/modules/videoFsPath'
import { Main } from '@/remotion/Video/Main'
import CurrentVideo from '@/state/CurrentVideo'
import Videos from '@/state/Videos'
import type {
  VideoConfig,
} from '@/types'
import {
  Player,
  PlayerRef,
} from '@remotion/player'
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { NextPage } from 'next'
import Head from 'next/head'
import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createContainer } from 'unstated-next'
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from '../constants'

import {
  Style,
  VideoType,
} from '../types/enums'
import styles from './styles'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
})

const useStyle = (initialStyle: Style) => {
  return useState<Style>(null)
}

export const StyleContainer = createContainer(useStyle)

const useImageVersion = () => {
  const [version, setVersion] = useState(0)

  const incrementVersion = () => {
    setVersion((v) => v + 1)
  }

  return [version, incrementVersion]
}

export const ImageVersionContainer = createContainer(useImageVersion)

type VideoDetail = {
  title: string,
  caption: string,
  videoType: VideoType,
}

const VideoDetailContainer = createContainer(() => {
  const [videoDetail, setVideoDetail] = useState<VideoDetail>({
    title: '',
    caption: 'Basil Breen',
    videoType: VideoType.Storybook,
  })

  return [videoDetail, setVideoDetail]
})

const VideoDetailEditor: React.FC = () => {
  const [videoDetail, setVideoDetail] = VideoDetailContainer.useContainer()

  return (
    <div className="flex flex-col">
      <select
        className={`${styles.input} w-full mb-4`}
        value={videoDetail?.videoType ?? ''}
        onChange={(e) => {
          setVideoDetail({
            ...videoDetail,
            videoType: e.target.value as VideoType,
          })
        }}
      >
        {Object.entries(VideoType).map(([key, value]) => {
          return (
            <option key={value} value={value}>{key}</option>
          )
        })}
      </select>
    </div>
  )
}

// TODO: look into https://www.npmjs.com/package/use-remotion-player

function CurrentVideosSelector() {
  const [videos] = Videos.useContainer()
  const {
    setCurrentVideoId,
    currentVideoId,
  } = CurrentVideo.useContainer()

  const options = videos.length ? videos : [{
    name: 'Loading...',
  }]

  return (
    <select
      className={`${styles.input} w-full mb-4`}
      value={currentVideoId ?? ''}
      onChange={(e) => setCurrentVideoId(e.target.value)}
    >
      {options.map((video) => {
        const id = video.name
        return (
          <option
            key={id}
            value={id}
          >
            {id}
          </option>
        )
      })}
    </select>
  )
}

const RenderVideo: React.FC<{
  videoConfig: VideoConfig
}> = ({
  videoConfig,
}) => {
  return (
    <button
      type="button"
      className={`mb-4 ${styles.button}`}
      onClick={() => {
        fetch('http://localhost:3000/api/videos/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(videoConfig),
          cache: 'no-cache',
        })
      }}
    >
      Render Video
    </button>
  )
}

function RegenerateImage({
  videoName,
  style,
  caption,
  captionIndex,
  imageIndex,
}) {
  const [negative, setNegative] = useState('')
  return (
    <div className="flex mb-2">
      <button
        type="button"
        className={`${styles.button} mr-2`}
        onClick={() => {
          fetch('http://localhost:3000/api/storybooks/images', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoName,
              style,
              caption,
              captionIndex,
              imageIndex,
              negative,
            }),
            cache: 'no-cache',
          })
        }}
      >
        Regenerate Image
      </button>
      <input
        className={`${styles.input}`}
        value={negative}
        onChange={(e) => setNegative(e.target.value)}
        placeholder="negative"
      />
    </div>

  )
}

function SwapImage({
  videoName,
  style,
  captionIndex,
  imageIndex,
  caption,
  captions,
  incrementVersion,
}) {
  const [oldSubIndex, setOldSubIndex] = useState(0)
  const [oldImageIndex, setOldImageIndex] = useState(0)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexGrow: 1,
        flexShrink: 1,
      }}
      className="mb-2"
    >
      <button
        type="button"
        className={`${styles.button}`}
        onClick={async () => {
          await fetch('http://localhost:3000/api/storybooks/images', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoName,
              style,
              oldSubIndex,
              oldImageIndex,
              captionIndex,
              imageIndex,
              caption,
            }),
            cache: 'no-cache',
          })
          incrementVersion()
        }}
      >
        Swap
        {' '}
        {caption}
        {' - '}

        {captionIndex}
        {' '}
      </button>
      <select
        className={`${styles.input}`}
        value={oldSubIndex ?? ''}
        onChange={(e) => setOldSubIndex(e.target.value)}
      >
        {captions.map((caption, index) => {
          if (caption.images === 0) return null
          return (
            <option key={index} value={index}>{caption.text}</option>
          )
        })}
      </select>
      <input className={`${styles.input}`} value={oldImageIndex} onChange={(e) => setOldImageIndex(e.target.value)} placeholder="image index" />
    </div>
  )
}

const GenerateStorybook: React.FC<{
  videoName: string,
}> = ({
  videoName,
}) => {
  return (
    <button
      type="button"
      className={` mb-4 ${styles.button}`}
      onClick={() => {
        fetch('http://localhost:3000/api/storybooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoName,

          }),
          cache: 'no-cache',
        })
      }}
    >
      Generate Storybook
    </button>
  )
}

const GenerateImages: React.FC< {
  videoName: string,
  style: Style
} > = ({
  videoName,
  style,
}) => {
  return (
    <button
      type="button"
      className={` mb-4 ${styles.button}`}
      onClick={() => {
        fetch('http://localhost:3000/api/storybooks/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoName,
            style,
          }),
          cache: 'no-cache',
        })
      }}
    >
      Generate Images
    </button>
  )
}

const useExistingStyles = (videoName) => {
  const {
    data: existingStyles,
  } = useSuspenseQuery({
    initialData: [],
    queryKey: ['storybooks', videoName],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/storybooks/images?videoName=${videoName}`, {
        cache: 'no-cache',
      })
      return response.json()
    },
  })

  return existingStyles
}

function StroybookImage({
  videoName,
  style,
  caption,
  captionIndex,
  imageIndex,
  version,
  incrementVersion,
  currentVideo,
  image,
}) {
  const imagePath = `${image}?v=${version}`
  const [isError, setIsError] = useState(false)
  const [prevImagePath, setPrevImagePath] = useState(imagePath)

  useEffect(() => {
    if (prevImagePath !== imagePath) {
      setIsError(false)
      setPrevImagePath(imagePath)
    }
  }, [imagePath, prevImagePath])

  if (isError) {
    return (
      <div>
        <p>
          No image found for
          {' '}
          {caption}
          {' '}
          -
          {' '}
          {captionIndex}
          {' '}
          -
          {' '}
          {imageIndex}
        </p>
        <RegenerateImage
          videoName={videoName}
          style={style}
          caption={caption}
          captionIndex={captionIndex}
          imageIndex={imageIndex}
        />
      </div>
    )
  }

  return (
    <>
      <SwapImage
        incrementVersion={incrementVersion}
        captions={currentVideo?.captions}
        videoName={videoName}
        style={style}
        caption={caption}
        captionIndex={captionIndex}
        imageIndex={imageIndex}
      />
      <RegenerateImage
        videoName={videoName}
        style={style}
        caption={caption}
        captionIndex={captionIndex}
        imageIndex={imageIndex}
      />
      <img
        alt="lad"
        src={`${image}?v=${version}`}
        className="mb-4"
        onError={
          () => {
            setIsError(true)
          }
        }
      />
    </>
  )
}

const StorybookPages: React.FC<{
  videoName: string,
}> = ({
  videoName,
}) => {
  const [style, setStyle] = StyleContainer.useContainer()

  const existingStyles = useExistingStyles(videoName)

  useEffect(() => {
    setStyle(existingStyles[0])
  }, [existingStyles])

  const {
    currentVideo,
  } = CurrentVideo.useContainer()

  const [version, incrementVersion] = ImageVersionContainer.useContainer()

  const imagePaths = currentVideo?.captions.map((caption, captionIndex) => {
    const paths = []
    for (let imageIndex = 0; imageIndex < caption.images; imageIndex++) {
      const image = getStorybookImagePath(
        videoName,
        style,
        captionIndex,
        imageIndex,
      )
      paths.push({
        image: staticFile(image),
        caption: caption.text,
        captionIndex,
        imageIndex,
      })
    }
    return paths
  }).flat()

  const [open, setOpen] = React.useState(false)

  const header = (
    <>
      <p>
        Existing styles:
        {' '}
        {existingStyles.join(', ')}
      </p>
      <select
        className={`${styles.input} w-full mb-4`}
        value={style ?? ''}
        onChange={(e) => {
          return setStyle(e.target.value as Style)
        }}
      >
        {Object.entries(Style).map(([key, value]) => {
          return (
            <option key={value} value={value}>{key}</option>
          )
        })}
      </select>
      <GenerateImages
        videoName={videoName}
        style={style}
      />
    </>
  )

  if (!existingStyles.length) {
    return (
      <>
        <p>
          No existing images for any styles found
        </p>
        {header}
      </>
    )
  }

  return (
    <div className="flex flex-col ">
      {header}
      <button
        type="button"
        className={` mb-4 ${styles.button}`}
        onClick={() => {
          setOpen(!open)
        }}
      >
        {open ? 'Close images' : 'Open images'}
      </button>
      {open && imagePaths.map(({
        image,
        captionIndex,
        imageIndex,
        caption,
      }) => {
        return (
          <StroybookImage
            key={`${captionIndex}-${imageIndex}`}
            videoName={videoName}
            style={style}
            caption={caption}
            captionIndex={captionIndex}
            imageIndex={imageIndex}
            version={version}
            incrementVersion={incrementVersion}
            currentVideo={currentVideo}
            image={image}
          />
        )
      })}
    </div>
  )
}

const Storybooks: React.FC<{
    videoName: string,
  }> = ({
    videoName,
  }) => {
    const {
      data: storybook,
    } = useSuspenseQuery({
      initialData: null,
      queryKey: ['storybooks', videoName],
      queryFn: async () => {
        const response = await fetch(`http://localhost:3000/api/storybooks?videoName=${videoName}`, {
          cache: 'no-cache',
        })
        return response.json()
      },
    })

    const [open, setOpen] = React.useState(false)

    const header = (
      <GenerateStorybook
        videoName={videoName}
      />
    )

    if (!storybook) {
      return (
        <>
          <p>
            No storybook found
          </p>
          {header}
        </>
      )
    }

    return (
      <div className="flex flex-col ">
        {header}
        <Suspense fallback={<div>Loading...</div>}>
          <StorybookPages videoName={videoName} />
        </Suspense>
      </div>
    )
  }

function Page() {
  const { currentVideo } = CurrentVideo.useContainer()

  const playerRef = useRef<PlayerRef>(null)

  const [videoDetail, setVideoDetail] = VideoDetailContainer.useContainer()
  const title = toTitleCase(currentVideo?.name?.split('__')[0].trim() ?? '')

  useEffect(
    () => {
      setVideoDetail((state) => ({
        ...state,
        title,
      }))
    },
    [title],
  )

  const seekTo = (frame: number) => {
    playerRef.current?.seekTo(frame)
  }

  const [imageVersion, incrementVersion] = ImageVersionContainer.useContainer()

  const [storybookPageStyle] = StyleContainer.useContainer()

  const {
    data: durationInFrames,
  } = useSuspenseQuery({
    initialData: 0,
    queryKey: ['videoDuration', currentVideo?.name, videoDetail.videoType],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/videos/duration?videoName=${currentVideo?.name}&videoType=${videoDetail.videoType}`)
      return response.json()
    },
  })
  const videoConfig: VideoConfig = {
    video: {
      name: currentVideo?.name ?? '',
      captions: currentVideo?.captions ?? [],
    },
    title: videoDetail.title,
    caption: videoDetail.caption,
    videoType: videoDetail.videoType,
    storybookPageStyle,
    imageVersion,
  }

  const [slowMo, setSlowMo] = useState(false)

  return (
    <div>
      <Head>
        <title>Remotion and Next.js</title>
        <meta name="description" content="Remotion and Next.js" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className="flex justify-between w-full"
      >
        <div
          className="w-[512px] p-4"
        >
          <CurrentVideosSelector />
          <RenderVideo
            videoConfig={videoConfig}
          />
          <button onClick={() => setSlowMo(!slowMo)} className={`${styles.button} ml-2`}>
            Slow Mo
          </button>
          <CaptionTimeEditor
            seekTo={seekTo}
            isPlaying={() => playerRef.current?.isPlaying()}
            getCurrentFrame={() => playerRef.current?.getCurrentFrame()}
          />
        </div>
        <div className="w-[512px] p-4">
          <Suspense fallback={<div>Loading...</div>}>
            <VideoDetailEditor />
            <Storybooks videoName={currentVideo?.name ?? ''} />
          </Suspense>
        </div>
        {!!durationInFrames && (
          <Player
            playbackRate={slowMo ? 0.5 : 1}
            component={Main}
            durationInFrames={durationInFrames}
            fps={VIDEO_FPS}
            compositionHeight={VIDEO_HEIGHT}
            compositionWidth={VIDEO_WIDTH}
            controls
            inputProps={videoConfig}
            ref={playerRef}
            className="mx-auto"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'scale(0.4) translate(-50%, -50%)',
              transformOrigin: 'top left',
            }}
          />
        )}
      </div>
    </div>
  )
}

function CaptionsProvider({ children }) {
  const {
    data: videos,
  } = useSuspenseQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/videos', {
        cache: 'no-cache',
      })
      return response.json()
    },
  })
  return (
    <Videos.Provider initialState={videos}>
      <StyleContainer.Provider initialState={Style.Neon}>
        {children}
      </StyleContainer.Provider>
    </Videos.Provider>
  )
}

const Home: NextPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <VideoDetailContainer.Provider>
        <ImageVersionContainer.Provider>
          <Suspense fallback={<div>Loading...</div>}>
            <CaptionsProvider>
              <CurrentVideo.Provider>
                <Page />
              </CurrentVideo.Provider>
            </CaptionsProvider>
          </Suspense>
        </ImageVersionContainer.Provider>
      </VideoDetailContainer.Provider>
    </QueryClientProvider>
  )
}

export default Home
