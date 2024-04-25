import { promises as fs } from 'fs'
import format from 'string-template'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs'
import {
  StorybookPage,
} from '@/types'
import {
  getLyricsTxt,
  getSubtitlesJson,
} from '@/modules/videoFs'
import { openai } from '@/modules/openai'
import { retry } from '@/modules/async'

import { toTitleCase } from '@/modules/strings'
import { getSubtitleImageFileName } from '../../../modules/videoFsPath'

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

export const getImageWordsCounts = (subtitles) => {
  const wordCounts = { }
  const subtitleIndexWordCounts = { }

  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i]
    const { text } = subtitle

    wordCounts[text] = wordCounts[text] ? wordCounts[text] + 1 : 1

    subtitleIndexWordCounts[i] = wordCounts[text]
  }

  return {
    subtitleIndexWordCounts,
    wordCounts,
  }
}

const getImagesToCreate = (subtitles) => {
  const imageStarts = []
  for (let subtitleIndex = 0; subtitleIndex < subtitles.length; subtitleIndex++) {
    const subtitle = subtitles[subtitleIndex]
    const imageCount = subtitle.images || 0

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
      imageStarts.push({
        subtitleIndex,
        imageIndex,
      })
    }
  }

  return imageStarts
}

export const generateStorybookBasic = async (
  videoName: string,
): Promise<StorybookPage[]> => {
  const subtitles = await getSubtitlesJson(videoName)

  const lyrics = await getLyricsTxt(videoName)

  const system = await fs.readFile('./prompts/lyric-image/system.txt', 'utf8')
  const userCreateImage = await fs.readFile('./prompts/lyric-image/user-create-image.txt', 'utf8')
  const userImageDescribe = await fs.readFile('./prompts/lyric-image/user-image-describe.txt', 'utf8')
  const userCreateImageNext = await fs.readFile('./prompts/lyric-image/next-image.txt', 'utf8')

  const {
    subtitleIndexWordCounts,
  } = getImageWordsCounts(subtitles)

  const imagesToCreate = getImagesToCreate(subtitles)

  console.log(`gettings descriptions for ${imagesToCreate.length} images`)
  const ideas = []

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: system,
    },
  ]

  for (const {
    subtitleIndex,
    imageIndex,
  } of imagesToCreate) {
    const subtitle = subtitles[subtitleIndex]
    const wordCount = countNames[subtitleIndexWordCounts[subtitleIndex]]
    const promt = ideas.length > 0 ? userCreateImageNext : userCreateImage
    const userCreateImagePrompt = format(promt, {
      song: toTitleCase(videoName.split('__')[0]),
      word: subtitle.text,
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
      subtitleIndex,
      imageIndex,
    })
    messages.push({
      role: 'assistant',
      content: imageIdea,
    })

    console.log(`Generated image for ${subtitle.text} ${imageIndex > 0 ? ` at index ${imageIndex}` : ''}`)
  }

  const promises = ideas.map(async ({
    imageIdea,
    subtitleIndex,
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
      [getSubtitleImageFileName(subtitleIndex, imageIndex)]: imageDescription,
    }
  })

  const storybookPages = await Promise.all(promises)

  console.log('Generated all images')

  return {
    storybookPages,
  }
}
