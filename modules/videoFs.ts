import { promises as fs } from 'fs'
import {
  Video,
  StorybookPage,
  Caption,
} from '@/types'
import {
  Style,
} from '@/types/enums'
import {
  getLyricsTxtPath,
  getStorybookImagePath,
  getStorybookPath,
  getCaptionAudioFilePath,
  getCaptionsFilePath,
  getVideoDir,
  getMediaFilePath,
} from './videoFsPath'
import { retry } from './async'

export const findMediaFilePath = async (videoName: string, mediaType: 'audio' | 'video'): Promise<string | null> => {
  const videoDir = getVideoDir(videoName)
  const videoFiles = await fs.readdir(videoDir)
  const videoFile = videoFiles.find((file) => file.startsWith(mediaType))
  if (videoFile) {
    return `${videoDir}/${videoFile}`
  }
  return null
}

const downloadImage = async (url: string, destinationPath: string) => {
  await retry(async () => {
    const response = await fetch(url, {
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to download image. Status code: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer) // Convert arrayBuffer to buffer

    await fs.writeFile(destinationPath, buffer)
    console.log(`Image downloaded to ${destinationPath}`)
  })
}

export const getCaptionsJson = async (videoName: string): Promise<Caption[]> => {
  const captionsFilePath = getCaptionsFilePath(videoName)
  const json = await fs.readFile(captionsFilePath, 'utf8')
  return JSON.parse(json)
}

export const getLyricsTxt = async (videoName: string): Promise<string> => {
  const subs = await getCaptionsJson(videoName)
  return subs.map((sub) => sub.text).join(' ')
  const captionsFilePath = getLyricsTxtPath(videoName)
  const txt = await fs.readFile(captionsFilePath, 'utf8')
  return txt
}

export const makeVideoDir = async (name: string) => {
  const videoDir = getVideoDir(name)
  await fs.mkdir(videoDir, { recursive: true })
}

export const writeCaptionsToFile = async (segmentCaptions: Video) => {
  const captionsFilePath = getCaptionsFilePath(segmentCaptions.name)
  await fs.writeFile(captionsFilePath, JSON.stringify(segmentCaptions.captions, null, 2))
}

export const writeLyricsTxtToFile = async (name: string, lyrics: string) => {
  const lyricsFilePath = getLyricsTxtPath(name)
  await fs.writeFile(lyricsFilePath, lyrics)
}

export const writeCaptionAudioToFile = async (name: string, file: Buffer, extension: string) => {
  const captionsFilePath = getCaptionAudioFilePath(name, extension)
  await fs.writeFile(captionsFilePath, file)
}

export const getStorybookJson = async (
  videoName: string,
) : Promise<StorybookPage[]> => {
  const storybookPath = getStorybookPath(videoName)
  const storybookContents = await fs.readFile(storybookPath, 'utf8')
  return JSON.parse(storybookContents).storybookPages
}

export const writeStorybookToFile = async (
  videoName: string,
  images: StorybookPage[],
) => {
  const storybookPath = getStorybookPath(videoName)
  await fs.writeFile(storybookPath, JSON.stringify(images, null, 2))
}

export const writeStorybookImageToFile = async (
  imageUrl: string,
  style: Style,
  videoName: string,
  captionIndex: number,
  imageIndex: number,
  version: string = '',
) => {
  const storybookImagePath = getStorybookImagePath(
    videoName,
    style,
    captionIndex,
    imageIndex,
    version,
  )
  await downloadImage(imageUrl, storybookImagePath)
}

export const writeMediaBuffer =  async (videoName: string, buffer: Buffer, mediaType: 'audio' | 'video', extension: string ) => {
  const filePath = await getMediaFilePath(videoName, mediaType, extension)
  await fs.writeFile(filePath, buffer)
}
  

export default {
  writeCaptionsToFile,
  writeStorybookToFile,
  writeStorybookImageToFile,
}
