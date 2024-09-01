import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream';


export async function getFileBufferMediaType(buffer: Buffer): Promise<'video' | 'audio'> {
  return new Promise((resolve, reject) => {
    try {
      const stream = convertBufferToStream(buffer);
      ffmpeg(stream).ffprobe((error, data) => {
        debugger
        if (error) {
          console.error('Error reading file metadata:', error);
          reject('Error reading file metadata');
        }

        const isVideo = data.streams.some((stream) => stream.codec_type === 'video');
        const isAudio = data.streams.some((stream) => stream.codec_type === 'audio');

        let mediaType: 'video' | 'audio' | 'unknown' = 'unknown';

        if (isVideo) {
          resolve( 'video');
        } else if (isAudio) {
          resolve('audio')
        } else {
          reject('File is neither audio nor video');
          return
        }
      });
    } catch (error) {
      console.error('Error processing file:', error);
      reject('Error processing file');
    }
  });
}
function convertBufferToStream(buffer: Buffer): Readable  {
  const readable = new Readable();
  readable._read = () => {}; // _read is a no-op
  readable.push(buffer);
  readable.push(null); // Indicates the end of the stream
  return readable;
};

export function getMediaDuration(filePath: string | null): Promise<number> {
  if (!filePath) {
    return Promise.reject('No file path provided')
  }
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error)
        return
      }

      const { duration } = metadata.format

      if (!duration) {
        reject('No duration found')
        return
      }
      
      resolve(duration)
    })
  })
}
