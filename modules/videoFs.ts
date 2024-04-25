import { promises as fs } from 'fs'
import {
  Video,
  StorybookPage,
  Subtitle,
} from '@/types'
import {
  Style,
} from '@/types/enums'
import {
  getLyricsTxtPath,
  getStorybookImagePath,
  getStorybookPath,
  getSubtitlesFilePath,
} from './videoFsPath'
import { retry } from './async'

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

export const getSubtitlesJson = async (videoName: string): Promise<Subtitle[]> => {
  const subtitlesFilePath = getSubtitlesFilePath(videoName)
  const json = await fs.readFile(subtitlesFilePath, 'utf8')
  return JSON.parse(json)
}

export const getLyricsTxt = async (videoName: string): Promise<string> => {
  const subs = await getSubtitlesJson(videoName)
  return subs.map((sub) => sub.text).join(' ')
  const subtitlesFilePath = getLyricsTxtPath(videoName)
  const txt = await fs.readFile(subtitlesFilePath, 'utf8')
  return txt
}

export const writeSubtitlesToFile = async (segmentSubtitles: Video) => {
  const subtitlesFilePath = getSubtitlesFilePath(segmentSubtitles.name)
  await fs.writeFile(subtitlesFilePath, JSON.stringify(segmentSubtitles.subtitles, null, 2))
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
  subtitleIndex: number,
  imageIndex: number,
  version: string = '',
) => {
  const storybookImagePath = getStorybookImagePath(
    videoName,
    style,
    subtitleIndex,
    imageIndex,
    version,
  )
  await downloadImage(imageUrl, storybookImagePath)
}

export default {
  writeSubtitlesToFile,
  writeStorybookToFile,
  writeStorybookImageToFile,
}
