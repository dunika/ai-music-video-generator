import { Style } from '@/types/enums'

export const getVideoDir = (videoName: string) => `./public/songs/${videoName}`

export const getVideoFilePath = (videoName: string) => `${getVideoDir(videoName)}/video.mov`

export const getAudioFilePath = (videoName: string) => `${getVideoDir(videoName)}/audio.wav`

export const getSubtitlesFilePath = (videoName: string) => `${getVideoDir(videoName)}/subtitles.json`

export const getSubtitleAudioFilePath = (videoName: string, extension: string) => `${getVideoDir(videoName)}/subtitle_audio.${extension}`

export const getLyricsTxtPath = (videoName: string) => `${getVideoDir(videoName)}/lyrics.txt`

export const getStorybookPath = (videoName: string) => `${getVideoDir(videoName)}/storybook.json`

export const getStorybookRoot = (
  videoName: string,
) => {
  return `${getVideoDir(videoName)}/storybooks`
}

export const getStorybookImageDir = (
  videoName: string,
  style: Style,
) => {
  return `${getStorybookRoot(videoName)}/${style}`
}
export const getStorybookImagePath = (
  videoName: string,
  style: Style,
  subtitleIndex: number,
  imageIndex: number,
  version: string = '',
) => {
  const versionSuffix = version ? `-${version}` : ''
  return `${getStorybookImageDir(videoName, style)}/${subtitleIndex}_${imageIndex}${versionSuffix}.png`
}

export const getSubtitleImageFileName = (subtitleIndex: number, imageIndex: number) => {
  return `${subtitleIndex}_${imageIndex}`
}

export const getVideoConfigPath = () => './public/video/config.json'
