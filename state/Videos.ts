import { createContainer } from 'unstated-next'
import {
  useState,
} from 'react'
import type { Video } from '../types'

const useVideos = (initialVideos?: Video[]) => {
  return useState<Video[]>(initialVideos || [])
}

const Videos = createContainer(useVideos)

export default Videos
