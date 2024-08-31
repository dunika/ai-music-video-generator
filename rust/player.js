import init, { AudioPlayer } from './rust_audio_player/pkg/media_player.js';


const workerCode = `
  importScripts('rust_audio_player.js');

  let audioPlayer;

  self.onmessage = async function(e) {
    if (e.data.type === 'init') {
      await init();
      audioPlayer = new AudioPlayer();
      self.postMessage({ type: 'initialized' });
    } else if (e.data.type === 'loadAudio') {
      await audioPlayer.load_audio(new Uint8Array(e.data.audioData));
      self.postMessage({ type: 'audioLoaded' });
    } else if (e.data.type === 'play') {
      audioPlayer.play();
    } else if (e.data.type === 'stop') {
      audioPlayer.stop();
    }
  };
`;


const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
const worker = new Worker(workerUrl);

worker.onmessage = function(e) {
  console.log('Message from worker:', e.data);
};

// Initialize the worker
worker.postMessage({ type: 'init' });

// Function to load and play audio
export async function playAudio(arrayBuffer) {
  worker.postMessage({ type: 'loadAudio', audioData: arrayBuffer }, [arrayBuffer]);
}

