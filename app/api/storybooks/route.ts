import { promises as fs } from 'fs'
import path from 'path'
import { pathExists } from 'path-exists'
import {
  getStorybookPath,
} from '@/modules/videoFsPath'

import {
  getStorybookJson,
  writeStorybookToFile,
} from '@/modules/videoFs'

import { Style } from '@/types/enums'
import {
  generateStorybookBasic,
} from './gpt'
import { generateFromStoryBook } from './images/generateImagesFromStorybook'

export async function POST(request: Request) {
  const {
    videoName,
  } = await request.json()

  const storybookPath = getStorybookPath(videoName)

  await fs.mkdir(path.dirname(storybookPath), { recursive: true })

  const storyBook = await generateStorybookBasic(
    videoName,
  )

  await writeStorybookToFile(videoName, storyBook)

  const style = Object.values(Style)[Math.floor(Math.random() * Object.values(Style).length)]

  await generateFromStoryBook({
    videoName,
    style,
  })

  return Response.json(
    storyBook,
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const {
    videoName,
  } = Object.fromEntries(searchParams.entries())

  const storybookPath = getStorybookPath(videoName)

  const doesPathExist = await pathExists(storybookPath)
  if (!doesPathExist) {
    return Response.json(null)
  }

  const storybook = await getStorybookJson(videoName)
  return Response.json(
    storybook,
  )
}
