import type { Video } from '@/types'

import { writeSubtitlesToFile } from '@/modules/videoFs'

export async function POST(request: Request) {
  const {
    name,
    subtitles,
  } = await request.json() as Video

  await writeSubtitlesToFile({
    name,
    subtitles,
  })

  return Response.json({ success: true })
}
