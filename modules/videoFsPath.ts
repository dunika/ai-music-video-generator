import { Style } from '@/types/enums'

export const getVideoDir = (videoName: string) => `./public/songs/${videoName}`

export const getMediaFilePath = (videoName: string, mediaType: 'audio' | 'video', extension: string ) => {
  return `${getVideoDir(videoName)}/${mediaType}.${extension}`
}

export const getVideoFilePath = (videoName: string, extension: string = 'mov') => {
  return getMediaFilePath(videoName, 'video', extension)
}

export const getAudioFilePath = (videoName: string, extension: string = 'mov') => {
  return getMediaFilePath(videoName, 'video', extension)
}

export const getCaptionsFilePath = (videoName: string) => `${getVideoDir(videoName)}/captions.json`

export const getCaptionAudioFilePath = (videoName: string, extension: string) => `${getVideoDir(videoName)}/caption_audio.${extension}`

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
  captionIndex: number,
  imageIndex: number,
  version: string = '',
) => {
  const versionSuffix = version ? `-${version}` : ''
  return `${getStorybookImageDir(videoName, style)}/${captionIndex}_${imageIndex}${versionSuffix}.png`
}

export const getCaptionImageFileName = (captionIndex: number, imageIndex: number) => {
  return `${captionIndex}_${imageIndex}`
}

export const getVideoConfigPath = () => './public/video/config.json'
