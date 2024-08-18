
import filenamify from 'filenamify'
import {
  makeVideoDir,
  writeLyricsTxtToFile,
  writeCaptionsToFile,
  writeMediaBuffer,
} from '@/modules/videoFs'
import deepgram from './deepgram'
import { getCaptions } from './getCaptions'
import { getFileBufferMediaInfo } from '@/modules/ffmpeg'

export async function POST(request: Request) {
  const formData = await request.formData()

  const videoName = filenamify(formData.get('videoName') as string)
  const file = formData.get('file') as File
  const fileToTranscribe = formData.get('fileToTranscribe') as File


  await makeVideoDir(videoName)

  // Save original media file
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const fileBufferMediaInto = await getFileBufferMediaInfo(fileBuffer)
  await writeMediaBuffer(videoName, fileBuffer, fileBufferMediaInto.mediaType, fileBufferMediaInto.extension)

  // Transcribe audio 
  const fileBufferToTranscribe = Buffer.from(await fileToTranscribe.arrayBuffer())

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    fileBufferToTranscribe,
    {
      model: 'nova-2',
      smart_format: true,
    },
  )

  if (!result || error) {
    return Response.json({
      success: false,
      error: error || 'No result',
    })
  }

  const { words, transcript } = result.results.channels[0].alternatives[0]
  const captions = getCaptions(words)

  await writeCaptionsToFile({
    name: videoName,
    captions: captions,
  })

  await writeLyricsTxtToFile(videoName, transcript)

  return Response.json({ success: true })
}
