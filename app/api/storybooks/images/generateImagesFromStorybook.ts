import { promises as fs } from 'fs'
import { pathExists } from 'path-exists'
import {
  getStorybookImageDir,
  getStorybookImagePath,
} from '@/modules/videoFsPath'
import {
  getStorybookJson,
  writeStorybookImageToFile,
} from '@/modules/videoFs'
import { Style } from '@/types/enums'
import {
  generateStorybookImage,
} from './gpt'

type GenerateFromStoryBook = {
  videoName: string
  style: Style
  overrideExisting?: boolean
}

export const generateFromStoryBook = async ({
  videoName,
  style,
  overrideExisting = false,
}: GenerateFromStoryBook) => {
  const storybook = await getStorybookJson(videoName)

  const storybookImagesDir = getStorybookImageDir(
    videoName,
    style,
  )

  await fs.mkdir(storybookImagesDir, { recursive: true })
  for (let i = 0; i < storybook.length; i++) {
    const [pageIndex, page] = Object.entries(storybook[i])[0]

    console.log(`Generating image ${i + 1} of ${storybook.length}`)
    const [subtitleIndex, imageIndex] = pageIndex.split('_')

    const storybookImagePath = getStorybookImagePath(
      videoName,
      style,
      Number(subtitleIndex),
      Number(imageIndex),
    )

    if (!overrideExisting) {
      const doesPathExist = await pathExists(storybookImagePath)

      if (doesPathExist) {
        console.log(`Image ${i + 1} of ${storybook.length} already exists`)
        continue
      }
    }

    const images = await generateStorybookImage(
      style,
      page,
    )

    for (let j = 0; j < images.length; j++) {
      await writeStorybookImageToFile(
        images[j],
        style,
        videoName,
        subtitleIndex,
        imageIndex,
        j > 0 ? j.toString() : '',
      )
    }

    console.log(`Generated image ${i + 1} of ${storybook.length}`)
  }
}
