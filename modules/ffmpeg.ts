import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream';
import mime from 'mime-types';


export async function getFileBufferMediaInfo(buffer: Buffer): Promise<{ mediaType: 'video' | 'audio'; mimeType: string; extension: string }> {
  return new Promise((resolve, reject) => {
    try {
      const stream = convertBufferToStream(buffer);
      ffmpeg(stream).ffprobe((error, data) => {
        if (error) {
          console.error('Error reading file metadata:', error);
          reject('Error reading file metadata');
        }

        const isVideo = data.streams.some((stream) => stream.codec_type === 'video');
        const isAudio = data.streams.some((stream) => stream.codec_type === 'audio');

        let mediaType: 'video' | 'audio' | 'unknown' = 'unknown';

        if (isVideo) {
          mediaType = 'video';
        } else if (isAudio) {
          mediaType = 'audio';
        } else {
          reject('File is neither audio nor video');
          return
        }

        // Get the codec_name from the relevant stream
        const codec = data.streams.find((stream) => stream.codec_type === mediaType)?.codec_name;

        // Determine the MIME type and extension using mime-types library
        let mimeType = 'application/octet-stream';
        let extension = '';

        if (codec) {
          mimeType = mime.lookup(codec) || mimeType;
          extension = mime.extension(mimeType) || '';
        }

        resolve({ mediaType, mimeType, extension });
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

export function getMediaDuration(filePath: string): Promise<number> {
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
