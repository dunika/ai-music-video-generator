import type {
  Video,
  Caption,
} from '@/types'

import { getCaptionsFilePath } from '@/modules/videoFsPath'
import { promises as fs } from 'fs'

import * as path from 'path'

const uuid = () => {
  return Math.random().toString(16).slice(2)
}

const getJsonCaptions = async (): Promise<Video[]> => {
  const dirPath = './public/videos'
  const videoNames = await fs.readdir('./public/videos')
  const videos = []
  for (const videoName of videoNames) {
    const videoNamePath = path.join(dirPath, videoName)
    const fileStat = await fs.stat(videoNamePath)
    if (!fileStat.isDirectory()) {
      continue
    }

    const fileContents = await fs.readFile(`${videoNamePath}/captions.json`, 'utf8')

    const captions: Caption[] = JSON.parse(fileContents).map((caption: Caption) => {
      return {
        ...caption,
        start: Math.round(caption.start / 100) * 100,
        end: Math.round(caption.end / 100) * 100,
      }
    })

    videos.push({
      name: videoName,
      captions,
      modifiedTime: fileStat.mtime,

    })
  }

  videos.sort((a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime())

  return videos.map(({ modifiedTime, ...rest }) => rest)
}

const addTextCaptions = async () => {
  const textFiles = await fs.readdir('./captions')

  for (const file of textFiles) {
    if (!file.endsWith('.txt')) {
      continue
    }

    const filePath = path.join('./captions', file)
    const fileContents = await fs.readFile(filePath, 'utf8')

    const fileCaptions = fileContents.split('\n').map((line, index) => {
      const start = (index * 800)
      const end = (index * 800 + 8000)

      return {
        start,
        end,
        text: line,
        id: uuid(),
      }
    })

    // write files to './public/videos'
    const videoName = file.replace(/\.txt$/, '')

    const newPath = getCaptionsFilePath(videoName)

    await fs.mkdir(path.dirname(newPath), { recursive: true })

    fs.writeFile(newPath, JSON.stringify(fileCaptions))
    fs.rm(filePath)
  }
}

export async function GET() {
  // await addTextCaptions()
  const captions = await getJsonCaptions()
  return Response.json(captions)
}
