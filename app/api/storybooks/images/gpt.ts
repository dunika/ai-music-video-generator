import { promises as fs } from 'fs'
import format from 'string-template'

import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import {
  Style,
  styleDescriptions,
} from '@/types/enums'

import { retry } from '@/modules/async'
import { openai } from '@/modules/openai'
import { toTitleCase } from '@/modules/strings'

// // Call theexport ren function to download the imag

export const generateStorybookImage = async (
  style: Style,
  imageDescription: string,
) => {
  const imageCreation = await fs.readFile('./prompts/trailer-image-creation.txt', 'utf8')

  const prompt = format(imageCreation, {
    imageDescription,
    orientation: 'Portrait',
    style: styleDescriptions[style],
  })

  const images = await retry(async () => {
    const response = await openai.images.generate({
      prompt,
      n: 1,
      quality: 'hd',
      size: '1024x1024',
      model: 'dall-e-3',
    })
    return response.data
  })

  return images.map((image) => image.url)
}

export const regenerateStorybookDescription = async (
  videoName: string,
  style: Style,
  oldDescription: string,
  lyrics: string,
  caption: string,
  negative?: string,
) => {
  const system = await fs.readFile('./prompts/lyric-image/system.txt', 'utf8')
  const userNewImage = await fs.readFile('./prompts/lyric-image/user-new-image.txt', 'utf8')
  const userImageDescribe = await fs.readFile('./prompts/lyric-image/user-image-describe.txt', 'utf8')
  console.log('image idea')

  const imageIdea = await retry(async () => {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: system,
      },
      {
        role: 'user',
        content: format(userNewImage, {
          word: caption,
          oldDescription,
          lyrics,
          song: toTitleCase(videoName.split('__')[0]),
          negative: negative || 'children',
        }),
      },
    ]

    const response = await openai.chat.completions.create({
      messages,
      model: 'gpt-4-0125-preview',
    })
    return response.choices[0].message.content
  })
  console.log('image description')
  const imageDescription = await retry(async () => {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: system,
        },
        {
          role: 'user',
          content: format(userImageDescribe, { idea: imageIdea }),
        },
      ],
      model: 'gpt-4-0125-preview',
    })

    return response.choices[0].message.content
  })

  console.log('image ')

  const images = await generateStorybookImage(style, imageDescription)
  return [imageDescription, images]
}
