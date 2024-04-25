import {
  staticFile as remotionStaticFile,
} from 'remotion'

export const staticFile = (path: string) => remotionStaticFile(path.replace('./public', ''))
