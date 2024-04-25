import type {
  Video,
  Subtitle,
} from '@/types'

import { getSubtitlesFilePath } from '@/modules/videoFsPath'
import { promises as fs } from 'fs'

import * as path from 'path'

const uuid = () => {
  return Math.random().toString(16).slice(2)
}

const getJsonSubtitles = async (): Promise<Video[]> => {
  const dirPath = './public/songs'
  const videoNames = await fs.readdir('./public/songs')
  const songs = []
  for (const videoName of videoNames) {
    const videoNamePath = path.join(dirPath, videoName)
    const fileStat = await fs.stat(videoNamePath)
    if (!fileStat.isDirectory()) {
      continue
    }
    const fileContents = await fs.readFile(`${videoNamePath}/subtitles.json`, 'utf8')

    const subtitles: Subtitle[] = JSON.parse(fileContents).map((subtitle: Subtitle) => {
      return {
        ...subtitle,
        start: Math.round(subtitle.start / 100) * 100,
        end: Math.round(subtitle.end / 100) * 100,
      }
    })

    songs.push({
      name: videoName,
      subtitles,
    })
  }

  return songs
}

const addTextSubtitles = async () => {
  const textFiles = await fs.readdir('./subtitles')

  for (const file of textFiles) {
    if (!file.endsWith('.txt')) {
      continue
    }
    const filePath = path.join('./subtitles', file)
    const fileContents = await fs.readFile(filePath, 'utf8')

    const fileSubtitles = fileContents.split('\n').map((line, index) => {
      const start = (index * 800)
      const end = (index * 800 + 8000)
      return {
        start,
        end,
        text: line,
        id: uuid(),
      }
    })

    // write files to './public/songs'
    const videoName = file.replace(/\.txt$/, '')

    const newPath = getSubtitlesFilePath(videoName)

    await fs.mkdir(path.dirname(newPath), { recursive: true })

    fs.writeFile(newPath, JSON.stringify(fileSubtitles))
    fs.rm(filePath)
  }
}

export async function GET() {
  // await addTextSubtitles()
  const subtitles = await getJsonSubtitles()
  return Response.json(subtitles)
}
