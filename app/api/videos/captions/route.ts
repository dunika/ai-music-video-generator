import type { Video } from '@/types'

import { writeCaptionsToFile } from '@/modules/videoFs'

export async function POST(request: Request) {
  const {
    name,
    captions: captions,
  } = await request.json() as Video

  await writeCaptionsToFile({
    name,
    captions: captions,
  })

  return Response.json({ success: true })
}
