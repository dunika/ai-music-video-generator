import filenamify from 'filenamify'

import {
  makeVideoDir,
  writeLyricsTxtToFile,
  writeSubtitleAudioToFile,
  writeSubtitlesToFile,
} from '@/modules/videoFs'
import deepgram from './deepgram'

function getCaptions(words) {
  const captions = words.map((word) => {
    return {
      start: convertSecondsToMilliseconds(word.start),
      end: convertSecondsToMilliseconds(word.end),
      text: cleanWord(word.word),
    }
  })

  captions.forEach((subtitle, i) => {
    const nextSubtitle = i + 1 < captions.length ? captions[i + 1] : null
    if (nextSubtitle) {
      const startTimeDifference = nextSubtitle.start - subtitle.start
      const duration = nextSubtitle.end - subtitle.start

      if (startTimeDifference < 200 || duration < 200) {
        nextSubtitle.start = subtitle.start + 200
        nextSubtitle.end = nextSubtitle.start + 200
      } else {
        const duration = subtitle.end - subtitle.start
        if (duration < 200) {
          subtitle.end = subtitle.start + 200
        }
      }
    }
  })

  return captions
}

function cleanWord(word) {
  let cleaned = word.toLowerCase()
  cleaned = cleaned.split('').filter((char) => char.match(/[a-z']/)).join('').trim()
  return cleaned
}

function roundToOneDecimalPlace(number) {
  return Math.round(number * 10) / 10
}

function convertSecondsToMilliseconds(seconds) {
  return roundToOneDecimalPlace(seconds) * 1000
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const name = filenamify(file.name.split('.')[0])
  const extension = file.name.split('.').at(-1) ?? ''
  const buffer = Buffer.from(await file.arrayBuffer())

  await makeVideoDir(name)

  await writeSubtitleAudioToFile(name, buffer, extension)

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    buffer,
    {
      model: 'nova-2',
      smart_format: true,
    },
  )

  const { words, transcript } = result.results.channels[0].alternatives[0]
  const captions = getCaptions(words)
  await writeSubtitlesToFile({
    name,
    subtitles: captions,
  })

  await writeLyricsTxtToFile(name, transcript)

  return Response.json({ success: true })
}
