import {
  VideoType,
  Style,
} from '@/types/enums'

export type Caption = {
  start: number
  text: string
  images?: number
}

export type Video = {
  name: string
  captions: Caption[]
}

export type StorybookPage = {
  imageDescription: string;
  cameraAngle: 'birds eye' | 'close up' | 'high angle' | 'low angle' | 'wide-angle' | 'back-view';
  narration: string;
  lineOfSong: string;
}

export type ImageAlignment = 'none' | 'top' | 'bottom'

export type VideoConfig = {
  video: Video;
  title?: string;
  caption? : string;
  titleWidth?: string;
  textColor?: string;
  videoType: VideoType;
  imageAlignment?: ImageAlignment
  storybookPageStyle?: Style;
  imageVersion?: number;
}
