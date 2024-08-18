import { promises as fs } from 'fs'
import * as path from 'path'
import { execa } from 'execa'
import _, { snakeCase } from 'lodash'
import type {
  VideoConfig,
} from '@/types'

import {
  COMP_NAME,
} from '@/constants'
import { writeCaptionsToFile } from '@/modules/videoFs'
import { VideoType } from '../../../../types/enums'

const transparentCaptionArgs = [
  '--image-format',
  'png',
  '--pixel-format',
  'yuva444p10le',
  '--codec',
  'prores',
  '--prores-profile',
  '4444',
  '--timeout',
  '120000',
  '--scale',
  '1.5',
]

export async function POST(request: Request) {
  const config: VideoConfig = await request.json()

  writeCaptionsToFile(config.video)

  await fs.writeFile('./public/video/config.json', JSON.stringify(config, null, 2))

  const remotionRoot = path.resolve('./remotion/index.ts')

  const outputFolder = path.resolve('./output')

  console.log('rendering video')

  const fileStem = `${snakeCase(config.video.name)}_${config.videoType}`

  const output = `${outputFolder}/${fileStem}.mov`

  const args = config.videoType === VideoType.Captions ? transparentCaptionArgs : []

  await execa('npx', [
    'remotion',
    'render',
    COMP_NAME,
    output,
    `${remotionRoot}`,
    ...args,
  ])

  console.log('finished rendering video: ', output)

  if (config.videoType === VideoType.Storybook) {
    const optimizedOutput = `${outputFolder}/${fileStem}.mp4`
    console.log('Optimizing video')
    await execa('ffmpeg', [
      '-i',
      output,
      '-i',
      '/Users/dunika/workspace/development/basil-breen/packages/music-videos/public/green_army_2.mov',
      '-c:v',
      'libx264',
      '-profile:v',
      'main',
      '-filter_complex',
      '[1:v]format=yuva420p[fg]; [0:v][fg]overlay=0:H-h',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      '-shortest',
      `${optimizedOutput}`,
    ])
    console.log('finished optimizing video')
  }

  return Response.json({ success: true })
}
