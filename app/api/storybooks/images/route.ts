import { promises as fs } from 'fs'
import { groupBy } from 'lodash'
import path from 'path'
import { pathExists } from 'path-exists'
import {
  getStorybookImageDir,
  getStorybookImagePath,
  getStorybookRoot,
} from '@/modules/videoFsPath'
import {
  getLyricsTxt,
  getStorybookJson,
  writeStorybookImageToFile,
  writeStorybookToFile,
} from '@/modules/videoFs'
import {
  regenerateStorybookDescription,
} from './gpt'
import { generateFromStoryBook } from './generateImagesFromStorybook'

// // Call the function to download the imag

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const {
    videoName,
  } = Object.fromEntries(searchParams.entries())

  const dir = getStorybookRoot(videoName)
  // get all top level directories
  const doesPathExist = await pathExists(dir)

  if (!doesPathExist) {
    return Response.json(null)
  }

  const list = await fs.readdir(dir)

  return Response.json(list.filter((file) => {
    return !file.startsWith('.')
  }))
}

export async function POST(request: Request) {
  const {
    videoName,
    style,
    overrideExisting,
  } = await request.json()

  await generateFromStoryBook({
    videoName,
    style,
    overrideExisting,
  })

  return Response.json({
    success: true,
  })
}

export async function PUT(request: Request) {
  const {
    videoName,
    style,
    subtitle,
    subtitleIndex,
    imageIndex,
    oldSubIndex,
    oldImageIndex,
    negative,
  } = await request.json()
  if (typeof oldSubIndex !== 'undefined' && typeof oldImageIndex !== 'undefined') {
    console.log('Swapping images')
    if (oldSubIndex === subtitleIndex && oldImageIndex === imageIndex) {
      return Response.json({
        success: true,
      })
    }
    const oldImagePath = getStorybookImagePath(
      videoName,
      style,
      oldSubIndex,
      oldImageIndex,
    )

    const newImagePath = getStorybookImagePath(
      videoName,
      style,
      subtitleIndex,
      imageIndex,
    )

    const tempPath = `${oldImagePath}.temp`

    // Rename oldImagePath to tempPath
    await fs.rename(
      oldImagePath,
      tempPath,
    )

    // Rename newImagePath to oldImagePath
    await fs.rename(
      newImagePath,
      oldImagePath,
    )

    // Rename tempPath to newImagePath
    await fs.rename(
      tempPath,
      newImagePath,
    )
    return Response.json({
      success: true,
    })
  }
  const storybookPages = await getStorybookJson(videoName)

  const pageIndex = storybookPages.findIndex((page) => {
    return Object.keys(page)[0] === `${subtitleIndex}_${imageIndex}`
  })

  const page = storybookPages[pageIndex]

  const lyrics = await getLyricsTxt(videoName)

  const imageKey = Object.keys(page)[0]
  const oldDescription = Object.values(page)[0]

  console.log('Regenerating image description')

  const [imageDescription, images] = await regenerateStorybookDescription(
    videoName,
    style,
    oldDescription,
    lyrics,
    subtitle,
    negative,
  )

  console.log('Finished regenerating image description')

  await writeStorybookImageToFile(
    images[0],
    style,
    videoName,
    subtitleIndex,
    imageIndex,
  )

  storybookPages[pageIndex] = {
    [imageKey]: imageDescription,
  }

  writeStorybookToFile(videoName, { storybookPages })

  return Response.json({
    success: true,
  })
}
