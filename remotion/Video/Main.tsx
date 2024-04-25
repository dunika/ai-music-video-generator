import React, {
  useEffect,
  useState,
} from 'react'
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  Animated,
  Move,
  Scale,
} from 'remotion-animated'
import { staticFile } from '../../modules/video'
import {
  getAudioFilePath,
  getStorybookImagePath,
  getVideoFilePath,
} from '../../modules/videoFsPath'
import {
  Subtitle,
  VideoConfig,
} from '../../types'
import {
  Style,
  VideoType,
} from '../../types/enums'
import './font.css'
import {
  getFontVariationSettings,
  getTextShadowAndOutline,
  styles,
  textColors,
} from './style'

const getImageStarts = (subtitlesClean: Subtitle[]) => {
  const subtitles = JSON.parse(JSON.stringify(subtitlesClean))
  subtitles[0].start = 0
  const imageStarts = []
  for (let subtitleIndex = 0; subtitleIndex < subtitles.length; subtitleIndex++) {
    const subtitle = subtitles[subtitleIndex]
    const { start } = subtitle
    let { end } = subtitle
    // find the next subtitle with images and use its start time as the end time
    for (let i = subtitleIndex + 1; i < subtitles.length; i++) {
      const nextSubtitle = subtitles[i]
      if (nextSubtitle.images) {
        end = nextSubtitle.start
        break
      }
    }

    const duration = (end - start)

    let imageStart = start
    for (let imageIndex = 0; imageIndex < subtitle.images; imageIndex++) {
      imageStarts.push({
        start: imageStart,
        subtitleIndex,
        imageIndex,
        text: subtitle.text,
      })
      imageStart = ((duration / subtitle.images) + imageStart)
    }
  }

  return imageStarts
}

type SingleImageProps = {
  align: 'none' | 'top' | 'bottom';
  show: boolean;
  imagePath: string;
  transform: string;
  subtitleIndex: number;
  text: string;
  imageIndex: number;
  height: string;
  bottom: string;
  top: string;
  imageVersion?: number;
}

const SingleImage: React.FC<SingleImageProps> = ({
  align,
  show,
  imagePath,
  transform,
  subtitleIndex,
  text,
  imageIndex,
  height,
  bottom,
  top,
  imageVersion,
}) => {
  const [isError, setIsError] = useState(false)
  const [prevImagePath, setPrevImagePath] = useState(imagePath)

  useEffect(() => {
    if (prevImagePath !== imagePath) {
      setIsError(false)
      setPrevImagePath(imagePath)
    }
  }, [imagePath, prevImagePath])

  const style = {
    position: 'absolute',
    left: 0,
    textAlign: 'center',
    bottom,
    top,
    padding: 0,
    transformOrigin: align === 'top' ? 'top center' : 'bottom center',
    margin: 0,
    transform,
    width: '100%',
    textTransform: 'uppercase',
    color: 'white',
    display: show ? 'block' : 'none',
    height,
    objectFit: 'cover',
  }

  if (isError) {
    return (
      <div style={{
        ...style,
        backgroundColor: 'white',
        transform: 'none',
      }}
      >
        <h1
          style={{
            marginTop: 800,
            fontSize: 100,
            color: 'red',
            fontWeight: 'bold',
          }}
        >
          {text}
          {' '}
        </h1>
        <h1
          style={{
            fontSize: 100,
            color: 'red',
            fontWeight: 'bold',
          }}
        >
          {' '}
          {subtitleIndex}
          {' '}
          -
          {' '}
          {imageIndex}
        </h1>
      </div>
    )
  }
  return (
    <Img
      onError={() => {
        setIsError(true)
      }}
      key={`${subtitleIndex}_${imageIndex}`}
      src={`${staticFile(imagePath)}?v=${imageVersion}`}
      style={style}
    />
  )
}

type ImageProps = {
  align?: 'none' | 'top' | 'bottom';
  subtitles: Subtitle[];
  videoName: string;
  storybookPageStyle: Style;
  imageVersion?: number;
}

const Images: React.FC<ImageProps> = ({
  align = 'none',
  subtitles,
  videoName,
  storybookPageStyle,
  imageVersion,
}) => {
  const videoConfig = useVideoConfig()
  const frame = useCurrentFrame()
  const top = align === 'top' ? 'auto' : '0'
  const bottom = align === 'bottom' ? 'auto' : '0'
  const height = align === 'none' ? '100%' : '1320px'

  const imageStarts = getImageStarts(subtitles)

  return (
    <div style={{
      position: 'absolute',
      bottom,
      top,
      left: '0',
      width: '100%',
      color: 'black',
      textAlign: 'center',
    }}
    >

      {imageStarts.map(({
        start,
        subtitleIndex,
        imageIndex,
        text,
      }) => {
        const startFrame = Math.round((start * videoConfig.fps) / 1000)
        const hasStarted = interpolate(
          (frame - startFrame),
          [0, 1],
          [0, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          },
        )

        const zoomIn = subtitleIndex % 2 === 0

        const zoomInAmount = interpolate(
          (frame - startFrame),
          [0, 30, 60, 90, 120, 150],
          [1, 1.02, 1.04, 1.06, 1.08, 1.1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          },
        )

        const zoomOutAmount = interpolate(
          (frame - startFrame),
          [0, 30, 60, 90, 120, 150],
          [1.1, 1.08, 1.06, 1.04, 1.02, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          },
        )

        const show = hasStarted || (subtitleIndex === 0 && frame < 30)
        const imagePath = getStorybookImagePath(
          videoName,
          storybookPageStyle,
          subtitleIndex,
          imageIndex,
        )

        return (
          <SingleImage
            imagePath={imagePath}
            key={`${subtitleIndex}_${imageIndex}`}
            transform={`scale(${zoomIn ? zoomInAmount : zoomOutAmount})`}
            show={!!show}
            align={align}
            text={text}
            subtitleIndex={subtitleIndex}
            imageIndex={imageIndex}
            height={height}
            bottom={bottom}
            top={top}
            imageVersion={imageVersion}
          />
        )
      })}
    </div>
  )
}

type SubtitleTextProps = {
  text: string;
  textColor: string;
  start: number;
  end: number;
}

const SubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  textColor,
  end,
  start,
}) => {
  const { fps } = useVideoConfig()
  const durationInFrames = Math.round(((end - start) * fps) / 1000)

  if (durationInFrames <= 0) {
    throw new Error(`Subtitle "${text}" duration is negative: ${durationInFrames} - start: ${start} - end: ${end}`)
  }

  const from = Math.round((start * fps) / 1000)

  return (
    <Sequence durationInFrames={durationInFrames} from={from}>
      <Animated
        style={{
          margin: '0 auto',
        }}
        animations={
        [Scale({
          by: 1,
          initial: 0.85,
          duration: 6,
        })]
        }
      >
        <div
          style={{
            ...styles.text,
            display: 'table',
            margin: '0 auto',
            color: textColor,
            lineHeight: 1.2,
            fontSize: 123,
            padding: '10px 20px',
            borderRadius: 10,
          }}
        >
          {text}
        </div>
      </Animated>
    </Sequence>
  )
}

type SubtitlesBoxProps = {
  subtitles: Subtitle[];
  textColor: string;
}

const SubtitlesBox: React.FC<SubtitlesBoxProps> = ({
  subtitles,
  textColor,
}) => {
  return (
    <div
      style={{
        ...styles.absoluteCenterX,
        // background: ' radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%)',
        top: 174,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        height: 136,
        zIndex: 100,
        borderRadius: '0%',
      }}
    >
      {subtitles.map((subtitle, index) => {
        const isLast = index === subtitles.length - 1
        // TODO: last logic
        return (
          <SubtitleText
            key={index}
            text={subtitle.text}
            textColor={textColor}
            start={subtitle.start}
            end={isLast ? subtitle.start + 5000 : subtitles[index + 1].start}
          />
        )
      })}
    </div>
  )
}

const songTextConfig = {
  'taking over the world': {
    titleFontSize: 80,
    headingMarginBottom: 102,
    titleMarginBottom: 100,
  },
}

const getTextConfig = (title: string) => {
  if (songTextConfig[title.toLowerCase()]) {
    return songTextConfig[title.toLowerCase()]
  }
  const wordCount = title.split(' ').length
  if (title.length <= 5) {
    return {
      titleFontSize: 96,
      headingMarginBottom: 85,
    }
  }
  if (wordCount === 2 || title.length <= 13) {
    return {
      titleFontSize: 120,
      headingMarginBottom: 157,
      titleMarginBottom: 55,
    }
  }
  return {
    titleFontSize: 70,
    headingMarginBottom: 93,
    titleMarginBottom: 60,
  }
}

const Title: React.FC<{
  width: string;
  textColor: string;
  textShadowColor: string;
  heading: string;
  videoType: VideoType;
  title: string;
}> = ({
  width,
  textColor,
  textShadowColor,
  heading: subtitle,
  videoType,
  title,
}) => {
  const { fps } = useVideoConfig()

  const textConfig = getTextConfig(title)
  return (
    <Sequence durationInFrames={10 * fps}>
      <div
        style={{
          ...styles.absoluteCenterX,
          top: 108,
          zIndex: 100,
          width,
        }}
      >
        <Animated
          style={{
            width: '100%',
          }}
          animations={videoType === VideoType.Storybook ? [
            Move({
              duration: 20 * fps,
              initialY: 0,
              y: -500,
            }),
          ] : []}
        >
          <div
            style={{
              ...styles.flexCenter,
              ...styles.text,
              color: textColor,
            }}
          >

            <div
              style={{
                transformOrigin: 'center',
                marginBottom: textConfig?.titleMarginBottom || 140,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  // fontWeight: 700,
                  textShadow: getTextShadowAndOutline(textShadowColor, '3'),
                  fontVariationSettings: getFontVariationSettings({
                    slant: -10,
                    uppercaseHeight: 760,
                  }),
                  letterSpacing: 3,
                  textAlign: 'center',
                }}
              >
                {subtitle}
              </div>
              <div
                style={{
                  letterSpacing: 3,
                  lineHeight: 1,
                  // fontWeight: 900,
                  fontVariationSettings: getFontVariationSettings({
                    slant: -10,
                    grad: 150,
                    uppercaseHeight: 760,
                  }),
                  // fontSize: textConfig?.titleFontSize || 96,
                  textShadow: `${getTextShadowAndOutline(textShadowColor, '3')}`,
                  marginBottom: 0,
                  fontSize: '60px',

                }}
              >
                {title}
              </div>
            </div>
          </div>
        </Animated>
      </div>
    </Sequence>
  )
}

type Props = VideoConfig & {
  isRendering: boolean;
}

export const Main: React.FC<Props> = ({
  video,
  title,
  subtitle: artist = 'Basil Breen',
  titleWidth = '90%',
  textColor = 'chirstmas',
  videoType,
  imageAlignment,
  storybookPageStyle,
  isRendering = false,
  imageVersion,
  hasAudio,
  hasVideo,
}) => {
  const { text, shadow } = textColors[textColor]
  const audioUrl = getAudioFilePath(video.name)
  const videoUrl = getVideoFilePath(video.name)
  return (
    <AbsoluteFill style={{
      backgroundColor: 'transparent',
    }}
    >
      {videoType === VideoType.Storybook && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'rgba(0,0,0,0.3)',
        }}
      />
      )}
      {hasVideo && videoType === VideoType.Subtitles && !isRendering && (
        <Video
          src={staticFile(videoUrl)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      {(!isRendering || hasAudio) && audioUrl && (
        <Audio
          src={staticFile(audioUrl)}
        />
      )}
      {/* {videoType === VideoType.Storybook && (
        <Video
          style={{o
            position: 'absolute',
            bottom: 0,
            zIndex: 200,

            // width: '100%',
            // height: '100%',
            // objectFit: 'cover',
          }}
        >
          <source src={staticFile('green_army_2.mov')} type='video/mp4; codecs="hvc1"' />
        </Video>
      )} */}

      {/* {videoType === VideoType.Singing && ( */}
      {/* {title && (
        <Title
          width={titleWidth}
          textColor={text}
          textShadowColor={shadow}
          heading={artist}
          title={title}
          videoType={videoType}
        />
      )} */}
      <SubtitlesBox
        subtitles={video.subtitles}
        textColor={text}
        textShadow={shadow}
      />
      {videoType === VideoType.Storybook && (
        <Images
          align={imageAlignment}
          subtitles={video.subtitles}
          videoName={video.name}
          storybookPageStyle={storybookPageStyle}
          imageVersion={imageVersion}
        />
      )}
    </AbsoluteFill>
  )
}
