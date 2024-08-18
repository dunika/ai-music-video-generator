import { promises as fs } from 'fs'
import format from 'string-template'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs'
import {
  StorybookPage,
} from '@/types'
import {
  getLyricsTxt,
  getCaptionsJson,
} from '@/modules/videoFs'
import { openai } from '@/modules/openai'
import { retry } from '@/modules/async'

import { toTitleCase } from '@/modules/strings'
import { getCaptionImageFileName } from '../../../modules/videoFsPath'

const countNames = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'eighth',
  9: 'ninth',
  10: 'tenth',
  11: 'eleventh',
  12: 'twelfth',
}

export const getImageWordsCounts = (captions) => {
  const wordCounts = { }
  const captionIndexWordCounts = { }

  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i]
    const { text } = caption

    wordCounts[text] = wordCounts[text] ? wordCounts[text] + 1 : 1

    captionIndexWordCounts[i] = wordCounts[text]
  }

  return {
    captionIndexWordCounts,
    wordCounts,
  }
}

const getImagesToCreate = (captions) => {
  const imageStarts = []
  for (let captionIndex = 0; captionIndex < captions.length; captionIndex++) {
    const caption = captions[captionIndex]
    const imageCount = caption.images || 0

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
      imageStarts.push({
        captionIndex,
        imageIndex,
      })
    }
  }

  return imageStarts
}

export const generateStorybookBasic = async (
  videoName: string,
): Promise<StorybookPage[]> => {
  const captions = await getCaptionsJson(videoName)

  const lyrics = await getLyricsTxt(videoName)

  const system = await fs.readFile('./prompts/lyric-image/system.txt', 'utf8')
  const userCreateImage = await fs.readFile('./prompts/lyric-image/user-create-image.txt', 'utf8')
  const userImageDescribe = await fs.readFile('./prompts/lyric-image/user-image-describe.txt', 'utf8')
  const userCreateImageNext = await fs.readFile('./prompts/lyric-image/next-image.txt', 'utf8')

  const {
    captionIndexWordCounts,
  } = getImageWordsCounts(captions)

  const imagesToCreate = getImagesToCreate(captions)

  console.log(`gettings descriptions for ${imagesToCreate.length} images`)
  const ideas = []

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: system,
    },
  ]

  for (const {
    captionIndex,
    imageIndex,
  } of imagesToCreate) {
    const caption = captions[captionIndex]
    const wordCount = countNames[captionIndexWordCounts[captionIndex]]
    const promt = ideas.length > 0 ? userCreateImageNext : userCreateImage
    const userCreateImagePrompt = format(promt, {
      song: toTitleCase(videoName.split('__')[0]),
      word: caption.text,
      lyrics,
      wordCount,
      countNames,
    })

    messages.push({
      role: 'user',
      content: userCreateImagePrompt,
    })

    const imageIdea = await retry(async () => {
      const response = await openai.chat.completions.create({
        messages,
        model: 'gpt-4-0125-preview',
      })
      return response.choices[0].message.content
    })

    ideas.push({
      imageIdea,
      captionIndex,
      imageIndex,
    })
    messages.push({
      role: 'assistant',
      content: imageIdea,
    })

    console.log(`Generated image for ${caption.text} ${imageIndex > 0 ? ` at index ${imageIndex}` : ''}`)
  }

  const promises = ideas.map(async ({
    imageIdea,
    captionIndex,
    imageIndex,
  }) => {
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

    return {
      [getCaptionImageFileName(captionIndex, imageIndex)]: imageDescription,
    }
  })

  const storybookPages = await Promise.all(promises)

  console.log('Generated all images')

  return {
    storybookPages,
  }
}
