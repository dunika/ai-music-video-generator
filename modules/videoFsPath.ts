import { Style } from '@/types/enums'

export const getSongRoot = (videoName: string) => `./public/songs/${videoName}`

export const getVideoFilePath = (videoName: string) => `${getSongRoot(videoName)}/video.mov`

export const getAudioFilePath = (videoName: string) => `${getSongRoot(videoName)}/audio.wav`

export const getSubtitlesFilePath = (videoName: string) => `${getSongRoot(videoName)}/subtitles.json`

export const getLyricsTxtPath = (videoName: string) => `${getSongRoot(videoName)}/lyrics.txt`

export const getStorybookPath = (videoName: string) => `${getSongRoot(videoName)}/storybook.json`

export const getStorybookRoot = (
  videoName: string,
) => {
  return `${getSongRoot(videoName)}/storybooks`
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
